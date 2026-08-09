"""Hard eligibility checks for charging-station candidates."""

from typing import List

from charging_station_recommendation_api.models.request import ChargingStationCandidate


# Current fallback usable SOC. When EVAT supports live battery data, Node
# should pass a resolved usable SOC value to this function instead.
DEFAULT_USABLE_SOC_PCT = 10.0


def filter_eligible_candidates(
    candidates: List[ChargingStationCandidate],
    usable_soc_pct: float = DEFAULT_USABLE_SOC_PCT,
) -> List[ChargingStationCandidate]:
    """Keep operational stations, excluding only known unreachable SOC values."""

    return [
        candidate
        for candidate in candidates
        if candidate.isOperational
        and (candidate.chargingPoints is None or candidate.chargingPoints > 0)
        and (
            candidate.socWithContingencyPct is None
            or candidate.socWithContingencyPct <= usable_soc_pct
        )
    ]
