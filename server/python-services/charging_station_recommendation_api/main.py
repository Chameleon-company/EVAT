"""Charging Station Recommendation API.

The Node API supplies enriched station candidates to this service. Ranking logic
will be added incrementally after the request contract is agreed by the team.
"""

from typing import Dict

from fastapi import FastAPI

from models import RankChargingStationsRequest, RankChargingStationsResponse


app = FastAPI(
    title="EV Charging Station Recommendation API",
    description="Ranks enriched EV charging-station candidates.",
    version="0.1.0",
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/charging-station-recommendations/rank",
    response_model=RankChargingStationsResponse,
)
def rank_charging_stations(
    request: RankChargingStationsRequest,
) -> RankChargingStationsResponse:
    """Return ranked stations once filtering and scoring are implemented."""

    # TODO: Apply hard filters, score eligible candidates, and return rankings.
    return RankChargingStationsResponse(recommendations=[])
