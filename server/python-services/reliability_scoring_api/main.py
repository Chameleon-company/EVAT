"""
Reliability Scoring API (single-file)

FastAPI port of EVAT-Data-Science Use_Cases/Reliability Scoring:
- Score: reliability = status_score * 0.6 + power_score * 0.4  (notebook OCM formula)
- Enriched Melbourne station CSV + VADER sentiment (dashboard ±0.2 thresholds)
"""

from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# ---------------------------------------------------------------------------
# Config (notebook weights + dashboard sentiment thresholds)
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = Path(
    os.getenv(
        "RELIABILITY_DATA_PATH",
        str(BASE_DIR / "data" / "EVAT-Final-Enriched.csv"),
    )
)
STATUS_WEIGHT = float(os.getenv("RELIABILITY_STATUS_WEIGHT", "0.6"))
POWER_WEIGHT = float(os.getenv("RELIABILITY_POWER_WEIGHT", "0.4"))
SENTIMENT_POSITIVE_THRESHOLD = 0.2
SENTIMENT_NEGATIVE_THRESHOLD = -0.2
HOST = os.getenv("RELIABILITY_API_HOST", "127.0.0.1")
PORT = int(os.getenv("RELIABILITY_API_PORT", "8003"))

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class StationScoreRequest(BaseModel):
    station_id: Optional[Union[str, int]] = None
    name: Optional[str] = None
    status: str = Field(..., description="Operational status string")
    power_kw: float = Field(..., ge=0, description="Charger power in kW")
    max_power_kw: Optional[float] = Field(
        default=None,
        ge=0,
        description="Max power for normalization; defaults to power_kw if omitted",
    )


class StationScoreRecord(BaseModel):
    station_id: Optional[Union[str, int]] = None
    name: Optional[str] = None
    status: str
    power_kw: float = Field(..., ge=0)


class BatchStationScoreRequest(BaseModel):
    records: List[StationScoreRecord]
    max_power_kw: Optional[float] = Field(
        default=None,
        description="Optional override for power normalization across the batch",
    )


class StationScoreResponse(BaseModel):
    station_id: Optional[Union[str, int]] = None
    name: Optional[str] = None
    status: str
    power_kw: float
    status_score: float
    power_score: float
    reliability_score: float
    formula: str = "reliability_score = status_score * 0.6 + power_score * 0.4"


class BatchStationScoreResponse(BaseModel):
    scores: List[StationScoreResponse]
    count: int
    max_power_kw: float
    timestamp: datetime


class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=0, description="User feedback text")


class SentimentResponse(BaseModel):
    text: str
    sentiment_score: float
    sentiment_label: str


class StationRecord(BaseModel):
    charger_id: Optional[str] = None
    charger_name: Optional[str] = None
    address: Optional[str] = None
    suburb: Optional[str] = None
    status: Optional[str] = None
    uptime_pct: Optional[float] = None
    downtime_pct: Optional[float] = None
    reliability_score: Optional[float] = None
    rating: Optional[float] = None
    user_feedback: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    power_kw: Optional[Any] = None
    last_checked: Optional[str] = None


class StationListResponse(BaseModel):
    stations: List[StationRecord]
    count: int
    total: int
    suburb: Optional[str] = None
    sentiment: Optional[str] = None


class SummaryResponse(BaseModel):
    total_stations: int
    online_pct: float
    avg_uptime: float
    avg_reliability: float
    sentiment_counts: Dict[str, int]
    suburb: Optional[str] = None
    last_refresh: str


class HealthResponse(BaseModel):
    status: str
    data_loaded: bool
    station_count: int
    data_path: str
    timestamp: datetime


# ---------------------------------------------------------------------------
# Scoring (from notebook OCM cells)
# reliability_score = status_score * 0.6 + power_score * 0.4
# ---------------------------------------------------------------------------


def status_to_score(status: str) -> float:
    """Operational (OCM) or Online (enriched data) => 100, else 0."""
    normalized = (status or "").strip().lower()
    if normalized in {"operational", "online"}:
        return 100.0
    return 0.0


def power_to_score(power_kw: float, max_power_kw: float) -> float:
    if max_power_kw is None or max_power_kw <= 0:
        return 0.0
    return max(0.0, min(100.0, (float(power_kw) / float(max_power_kw)) * 100.0))


def compute_reliability_score(
    status: str,
    power_kw: float,
    max_power_kw: Optional[float] = None,
) -> Tuple[float, float, float]:
    """Returns (status_score, power_score, reliability_score)."""
    peak = float(max_power_kw) if max_power_kw is not None else float(power_kw or 0)
    if peak <= 0:
        peak = 1.0

    status_score = status_to_score(status)
    power_score = power_to_score(power_kw, peak)
    reliability = (status_score * STATUS_WEIGHT) + (power_score * POWER_WEIGHT)
    return status_score, power_score, round(reliability, 6)


def resolve_batch_max_power(
    power_values: Sequence[float],
    override: Optional[float] = None,
) -> float:
    if override is not None and override > 0:
        return float(override)
    positives = [float(p) for p in power_values if p is not None and float(p) > 0]
    return max(positives) if positives else 1.0


def score_batch(
    records: List[dict],
    max_power_kw: Optional[float] = None,
) -> List[dict]:
    peak = resolve_batch_max_power(
        [r.get("power_kw", 0) for r in records],
        max_power_kw,
    )
    results = []
    for record in records:
        status_score, power_score, reliability = compute_reliability_score(
            status=str(record.get("status", "")),
            power_kw=float(record.get("power_kw") or 0),
            max_power_kw=peak,
        )
        results.append(
            {
                **record,
                "status_score": status_score,
                "power_score": round(power_score, 6),
                "reliability_score": reliability,
            }
        )
    return results


# ---------------------------------------------------------------------------
# Sentiment (from Streamlit dashboard VADER, thresholds ±0.2)
# ---------------------------------------------------------------------------

_sia: Optional[SentimentIntensityAnalyzer] = None


def _ensure_vader() -> SentimentIntensityAnalyzer:
    global _sia
    if _sia is not None:
        return _sia
    _sia = SentimentIntensityAnalyzer()
    return _sia


def score_text(text: str) -> Tuple[float, str]:
    """Positive >= 0.2, Negative <= -0.2, else Neutral."""
    cleaned = (text or "").strip()
    if not cleaned or cleaned.lower() in {"na", "n/a", "none", "nan"}:
        return 0.0, "Neutral"

    compound = float(_ensure_vader().polarity_scores(cleaned)["compound"])
    if compound >= SENTIMENT_POSITIVE_THRESHOLD:
        label = "Positive"
    elif compound <= SENTIMENT_NEGATIVE_THRESHOLD:
        label = "Negative"
    else:
        label = "Neutral"
    return compound, label


# ---------------------------------------------------------------------------
# Data loader (from dashboard load_data / filters / KPIs / top tables)
# ---------------------------------------------------------------------------

_df: Optional[pd.DataFrame] = None
_data_path: Optional[Path] = None


def first_col(df: pd.DataFrame, *cands: str) -> Optional[str]:
    for c in cands:
        if c in df.columns:
            return c
    return None


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    mapping: Dict[str, str] = {}
    specs = {
        "Charger_ID": ("Charger ID", "Charger_ID", "charger_id"),
        "Charger_Name": ("Charger Name", "Charger_Name", "charger_name", "Name"),
        "Address": ("Address", "address"),
        "Suburb": ("Suburb", "suburb"),
        "Status": ("Status", "status"),
        "Uptime_%": ("Uptime_%", "Uptime (%)", "uptime_percent", "Uptime"),
        "Downtime_%": ("Downtime_%", "Downtime (%)", "downtime_percent", "Downtime"),
        "reliability_score": ("reliability_score", "Reliability", "Reliability_Score"),
        "User_Feedback": (
            "User_Feedback",
            "User Feedback",
            "User Comment",
            "User_Comment",
        ),
        "Rating": ("Rating", "User Rating", "User_Rating"),
        "latitude": ("latitude", "Latitude", "lat"),
        "longitude": ("longitude", "Longitude", "lon", "lng"),
        "Last_Checked": ("Last_Checked", "Last Checked", "last_checked"),
        "Power (kW)": ("Power (kW)", "PowerKW", "power_kw", "Power"),
    }
    for canonical, cands in specs.items():
        col = first_col(df, *cands)
        if col and col != canonical:
            mapping[col] = canonical
    return df.rename(columns=mapping) if mapping else df


def load_data(path: Optional[Path] = None, force: bool = False) -> pd.DataFrame:
    global _df, _data_path

    target = Path(path) if path else DATA_PATH
    if _df is not None and not force and _data_path == target:
        return _df

    if not target.exists():
        raise FileNotFoundError(
            f"Reliability data file not found at {target}. "
            "Set RELIABILITY_DATA_PATH or place EVAT-Final-Enriched.csv under data/."
        )

    df = _normalize_columns(pd.read_csv(target))

    for col in [
        "Uptime_%",
        "Downtime_%",
        "reliability_score",
        "Rating",
        "latitude",
        "longitude",
    ]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "Last_Checked" in df.columns:
        df["Last_Checked"] = pd.to_datetime(df["Last_Checked"], errors="coerce")

    if "User_Feedback" not in df.columns:
        df["User_Feedback"] = ""
    df["User_Feedback"] = df["User_Feedback"].fillna("").astype(str).str.strip()

    if "Status" in df.columns:
        df["Status"] = df["Status"].fillna("Unknown").astype(str)
    if "Suburb" in df.columns:
        df["Suburb"] = df["Suburb"].fillna("Unknown").astype(str)

    parsed = df["User_Feedback"].apply(score_text)
    df["Sentiment_Score"] = parsed.apply(lambda x: x[0])
    df["Sentiment_Label"] = parsed.apply(lambda x: x[1])

    if "Charger_ID" in df.columns:
        df["Charger_ID"] = df["Charger_ID"].astype(str)

    _df = df
    _data_path = target
    return _df


def is_loaded() -> bool:
    return _df is not None


def station_count() -> int:
    if _df is None:
        return 0
    if "Charger_ID" in _df.columns:
        return int(_df["Charger_ID"].nunique())
    return len(_df)


def data_path_str() -> str:
    return str(_data_path or DATA_PATH)


def get_suburbs() -> List[str]:
    df = load_data()
    if "Suburb" not in df.columns:
        return []
    return sorted(df["Suburb"].dropna().astype(str).unique().tolist())


def _apply_filters(
    df: pd.DataFrame,
    suburb: Optional[str] = None,
    sentiment: Optional[str] = None,
    min_score: Optional[float] = None,
) -> pd.DataFrame:
    filtered = df.copy()
    if suburb and suburb.lower() != "all":
        filtered = filtered[
            filtered["Suburb"].astype(str).str.lower() == suburb.strip().lower()
        ]
    if sentiment and sentiment.lower() != "all":
        filtered = filtered[
            filtered["Sentiment_Label"].astype(str).str.lower()
            == sentiment.strip().lower()
        ]
    if min_score is not None and "reliability_score" in filtered.columns:
        filtered = filtered[filtered["reliability_score"].fillna(0) >= min_score]
    return filtered


def _row_to_station(row: pd.Series) -> Dict[str, Any]:
    last_checked = row.get("Last_Checked")
    if pd.isna(last_checked):
        last_str = None
    elif hasattr(last_checked, "isoformat"):
        last_str = last_checked.isoformat()
    else:
        last_str = str(last_checked)

    power = row.get("Power (kW)")
    if not isinstance(power, str) and pd.isna(power):
        power = None

    def num(key: str) -> Optional[float]:
        val = row.get(key)
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return None
        try:
            return float(val)
        except (TypeError, ValueError):
            return None

    return {
        "charger_id": None
        if pd.isna(row.get("Charger_ID"))
        else str(row.get("Charger_ID")),
        "charger_name": None
        if pd.isna(row.get("Charger_Name"))
        else str(row.get("Charger_Name")),
        "address": None if pd.isna(row.get("Address")) else str(row.get("Address")),
        "suburb": None if pd.isna(row.get("Suburb")) else str(row.get("Suburb")),
        "status": None if pd.isna(row.get("Status")) else str(row.get("Status")),
        "uptime_pct": num("Uptime_%"),
        "downtime_pct": num("Downtime_%"),
        "reliability_score": num("reliability_score"),
        "rating": num("Rating"),
        "user_feedback": str(row.get("User_Feedback") or ""),
        "sentiment_score": num("Sentiment_Score"),
        "sentiment_label": None
        if pd.isna(row.get("Sentiment_Label"))
        else str(row.get("Sentiment_Label")),
        "latitude": num("latitude"),
        "longitude": num("longitude"),
        "power_kw": power if isinstance(power, str) else num("Power (kW)"),
        "last_checked": last_str,
    }


def list_stations_data(
    suburb: Optional[str] = None,
    sentiment: Optional[str] = None,
    min_score: Optional[float] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[Dict[str, Any]], int]:
    df = load_data()
    filtered = _apply_filters(df, suburb, sentiment, min_score)
    total = len(filtered)

    if not filtered.empty and "reliability_score" in filtered.columns:
        filtered = filtered.sort_values(
            ["reliability_score", "Uptime_%"]
            if "Uptime_%" in filtered.columns
            else ["reliability_score"],
            ascending=[False, False] if "Uptime_%" in filtered.columns else [False],
        )

    page = filtered.iloc[offset : offset + limit]
    return [_row_to_station(row) for _, row in page.iterrows()], total


def get_station_data(charger_id: str) -> Optional[Dict[str, Any]]:
    df = load_data()
    if "Charger_ID" not in df.columns:
        return None
    matches = df[df["Charger_ID"].astype(str) == str(charger_id)]
    if matches.empty:
        return None
    return _row_to_station(matches.iloc[0])


def summary_data(suburb: Optional[str] = None) -> Dict[str, Any]:
    df = load_data()
    filtered = _apply_filters(df, suburb=suburb)

    if filtered.empty:
        total_stations = 0
        online_pct = 0.0
        avg_uptime = 0.0
        avg_rel = 0.0
        sentiment_counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
    else:
        if "Charger_ID" in filtered.columns:
            total_stations = int(filtered["Charger_ID"].nunique())
        else:
            total_stations = len(filtered)

        if "Status" in filtered.columns:
            online_pct = float(
                round(
                    100
                    * float(
                        filtered["Status"]
                        .astype(str)
                        .str.lower()
                        .isin(["online", "operational"])
                        .mean()
                    ),
                    1,
                )
            )
        else:
            online_pct = 0.0

        avg_uptime = (
            float(round(float(filtered["Uptime_%"].mean(skipna=True)), 1))
            if "Uptime_%" in filtered.columns
            else 0.0
        )
        avg_rel = (
            float(round(float(filtered["reliability_score"].mean(skipna=True)), 1))
            if "reliability_score" in filtered.columns
            else 0.0
        )

        counts = (
            filtered["Sentiment_Label"]
            .value_counts()
            .reindex(["Positive", "Neutral", "Negative"])
            .fillna(0)
            .astype(int)
        )
        sentiment_counts = {
            k: int(counts[k]) for k in ["Positive", "Neutral", "Negative"]
        }

    last = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    if "Last_Checked" in df.columns and not df["Last_Checked"].isna().all():
        max_checked = df["Last_Checked"].max()
        if not pd.isna(max_checked):
            last = max_checked.strftime("%Y-%m-%d %H:%M")

    return {
        "total_stations": total_stations,
        "online_pct": online_pct if online_pct == online_pct else 0.0,
        "avg_uptime": avg_uptime if avg_uptime == avg_uptime else 0.0,
        "avg_reliability": avg_rel if avg_rel == avg_rel else 0.0,
        "sentiment_counts": sentiment_counts,
        "suburb": suburb,
        "last_refresh": last,
    }


def top_stations_data(
    kind: str = "positive",
    suburb: Optional[str] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    df = load_data()
    filtered = _apply_filters(df, suburb=suburb)
    kind_l = (kind or "positive").lower()

    if filtered.empty:
        return []

    tmp = filtered.copy()
    if kind_l == "positive":
        tmp = tmp[tmp["Sentiment_Label"] == "Positive"].copy()
        if tmp.empty:
            return []
        tmp["rank_key"] = (
            tmp["Sentiment_Score"].fillna(0) * 1000 + tmp["Rating"].fillna(0)
        )
        show = tmp.sort_values("rank_key", ascending=False).head(limit)
    elif kind_l == "negative":
        tmp = tmp[tmp["Sentiment_Label"] == "Negative"].copy()
        if tmp.empty:
            return []
        tmp["rank_key"] = tmp["Sentiment_Score"].fillna(0) * 1000 - tmp[
            "reliability_score"
        ].fillna(0)
        show = tmp.sort_values("rank_key", ascending=True).head(limit)
    elif kind_l == "neutral":
        tmp = tmp[tmp["Sentiment_Label"] == "Neutral"].copy()
        if tmp.empty:
            return []
        tmp["abs0"] = tmp["Sentiment_Score"].abs()
        show = tmp.sort_values(
            ["abs0", "reliability_score"], ascending=[True, False]
        ).head(limit)
    else:
        show = tmp.sort_values("reliability_score", ascending=False).head(limit)

    return [_row_to_station(row) for _, row in show.iterrows()]


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="EVAT Reliability Scoring API",
    description=(
        "Charger reliability scoring and sentiment analysis "
        "(from EVAT-Data-Science Reliability Scoring use case)."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    try:
        load_data()
    except FileNotFoundError as exc:
        print(f"WARNING: {exc}")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    try:
        if not is_loaded():
            load_data()
        loaded = True
        count = station_count()
    except FileNotFoundError:
        loaded = False
        count = 0

    return HealthResponse(
        status="ok",
        data_loaded=loaded,
        station_count=count,
        data_path=data_path_str(),
        timestamp=datetime.utcnow(),
    )


@app.get("/suburbs")
def suburbs() -> dict:
    try:
        return {"suburbs": get_suburbs()}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/summary", response_model=SummaryResponse)
def summary(
    suburb: Optional[str] = Query(default=None, description="Filter by suburb"),
) -> SummaryResponse:
    try:
        return SummaryResponse(**summary_data(suburb=suburb))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/stations", response_model=StationListResponse)
def list_stations(
    suburb: Optional[str] = Query(default=None),
    sentiment: Optional[str] = Query(
        default=None,
        description="Positive | Neutral | Negative | All",
    ),
    min_score: Optional[float] = Query(default=None, ge=0, le=100),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> StationListResponse:
    try:
        stations, total = list_stations_data(
            suburb=suburb,
            sentiment=sentiment,
            min_score=min_score,
            limit=limit,
            offset=offset,
        )
        return StationListResponse(
            stations=[StationRecord(**s) for s in stations],
            count=len(stations),
            total=total,
            suburb=suburb,
            sentiment=sentiment,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/stations/{charger_id}", response_model=StationRecord)
def get_station(charger_id: str) -> StationRecord:
    try:
        station = get_station_data(charger_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if station is None:
        raise HTTPException(status_code=404, detail=f"Station not found: {charger_id}")
    return StationRecord(**station)


@app.get("/top", response_model=StationListResponse)
def top_stations(
    kind: str = Query(
        default="positive",
        description="positive | negative | neutral | reliability",
    ),
    suburb: Optional[str] = Query(default=None),
    limit: int = Query(default=5, ge=1, le=50),
) -> StationListResponse:
    allowed = {"positive", "negative", "neutral", "reliability"}
    if kind.lower() not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"kind must be one of {sorted(allowed)}",
        )
    try:
        stations = top_stations_data(kind=kind, suburb=suburb, limit=limit)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return StationListResponse(
        stations=[StationRecord(**s) for s in stations],
        count=len(stations),
        total=len(stations),
        suburb=suburb,
        sentiment=kind,
    )


@app.post("/score", response_model=StationScoreResponse)
def score_station(body: StationScoreRequest) -> StationScoreResponse:
    status_score, power_score, reliability = compute_reliability_score(
        status=body.status,
        power_kw=body.power_kw,
        max_power_kw=body.max_power_kw,
    )
    return StationScoreResponse(
        station_id=body.station_id,
        name=body.name,
        status=body.status,
        power_kw=body.power_kw,
        status_score=status_score,
        power_score=round(power_score, 6),
        reliability_score=reliability,
        formula=(
            f"reliability_score = status_score * {STATUS_WEIGHT} "
            f"+ power_score * {POWER_WEIGHT}"
        ),
    )


@app.post("/score/batch", response_model=BatchStationScoreResponse)
def score_stations_batch(body: BatchStationScoreRequest) -> BatchStationScoreResponse:
    if not body.records:
        raise HTTPException(status_code=400, detail="records must be a non-empty array")

    raw = [r.model_dump() for r in body.records]
    scored = score_batch(raw, max_power_kw=body.max_power_kw)
    peak = max((s["power_kw"] for s in scored), default=1.0)
    if body.max_power_kw is not None and body.max_power_kw > 0:
        peak = body.max_power_kw

    return BatchStationScoreResponse(
        scores=[
            StationScoreResponse(
                station_id=s.get("station_id"),
                name=s.get("name"),
                status=s["status"],
                power_kw=s["power_kw"],
                status_score=s["status_score"],
                power_score=s["power_score"],
                reliability_score=s["reliability_score"],
                formula=(
                    f"reliability_score = status_score * {STATUS_WEIGHT} "
                    f"+ power_score * {POWER_WEIGHT}"
                ),
            )
            for s in scored
        ],
        count=len(scored),
        max_power_kw=float(peak),
        timestamp=datetime.utcnow(),
    )


@app.post("/sentiment", response_model=SentimentResponse)
def analyze_sentiment(body: SentimentRequest) -> SentimentResponse:
    compound, label = score_text(body.text)
    return SentimentResponse(
        text=body.text,
        sentiment_score=compound,
        sentiment_label=label,
    )


if __name__ == "__main__":
    import uvicorn

    print(f"Data: {DATA_PATH}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
