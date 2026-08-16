# Reliability Scoring API

Python FastAPI service for the EVAT Reliability Scoring use case from
[EVAT-Data-Science](https://github.com/Chameleon-company/EVAT-Data-Science)
(`Use_Cases/Reliability Scoring`).

**Layout:** one app module `main.py` plus `data/EVAT-Final-Enriched.csv`.

## What it does

- Serves Melbourne charger reliability data from `EVAT-Final-Enriched.csv`
- Computes VADER sentiment on user feedback (dashboard thresholds ±0.2)
- Scores stations with the notebook formula:

  `reliability_score = status_score * 0.6 + power_score * 0.4`

  where status is 100 if Operational/Online else 0, and power is normalized 0–100.

## Setup

From the repository root:

```sh
npm run python:sync
```

## Run

From the repository root:

```sh
npm run dev:reliability
```

Or from `server/python-services`:

```sh
uv run --locked python -m uvicorn reliability_scoring_api.main:app --reload --host 127.0.0.1 --port 8003
```

Health: [http://127.0.0.1:8003/health](http://127.0.0.1:8003/health)

Swagger: [http://127.0.0.1:8003/docs](http://127.0.0.1:8003/docs)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service + data load status |
| GET | `/suburbs` | Distinct suburbs for filters |
| GET | `/summary` | KPI summary (optional `?suburb=`) |
| GET | `/stations` | Filtered station list (`suburb`, `sentiment`, `min_score`, `limit`, `offset`) |
| GET | `/stations/{charger_id}` | Single station by id |
| GET | `/top` | Top stations by `kind` = positive \| negative \| neutral \| reliability |
| POST | `/score` | Score one station from status + power_kw |
| POST | `/score/batch` | Batch scoring (shared max power normalization) |
| POST | `/sentiment` | VADER label for free-text feedback |

Node proxies this via `RELIABILITY_API_URL` (default `http://localhost:8003`)
under `/api/reliability/*`.

## Optional env

| Variable | Default | Purpose |
|----------|---------|---------|
| `RELIABILITY_DATA_PATH` | `data/EVAT-Final-Enriched.csv` | CSV path |
| `RELIABILITY_STATUS_WEIGHT` | `0.6` | Status weight |
| `RELIABILITY_POWER_WEIGHT` | `0.4` | Power weight |
