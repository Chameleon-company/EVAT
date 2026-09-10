from datetime import datetime
from typing import Dict, List, Optional

# Simple pattern-based occupancy prediction for each charging stations

# Helper function to parse hour from time string
def _parse_hour(time_value: Optional[str]) -> int:
    if not time_value:
        return datetime.now().hour
    try:
        return datetime.strptime(time_value, "%H:%M").hour
    except ValueError:
        return datetime.now().hour

# Helper function to format a list of hours into readable time ranges
def _format_hours(hours: List[int]) -> str:
    if not hours:
        return ""

    groups: List[tuple[int, int]] = []
    start = previous = hours[0]
    for hour in hours[1:]:
        if hour == previous + 1:
            previous = hour
            continue
        groups.append((start, previous))
        start = previous = hour
    groups.append((start, previous))

    return ", ".join(f"{start}:00-{end + 1}:00" for start, end in groups)

# Main prediction function
def predict(request_data: Dict) -> Dict:
    """Predict occupancy from historical hourly session averages."""
    historical = {
        int(hour): float(value)
        for hour, value in request_data.get("historical_occupancy", {}).items()
        if 0 <= int(hour) <= 23 and float(value) >= 0
    }

    if not historical:
        return {
            "status": "success",
            "station_id": request_data.get("station_id", ""),
            "predicted_occupancy": 0.0,
            "busy_hours": [],
            "off_peak_hours": [],
            # Simple return message
            "recommendation": "Insufficient historical data to predict occupancy.",
            "confidence": 0.0,
        }

    values = list(historical.values())
    average = sum(values) / len(values)
    maximum = max(values)
    busy_hours = sorted(
        hour for hour, value in historical.items() if value > average * 1.5
    )
    off_peak_hours = sorted(
        hour for hour, value in historical.items() if value < average * 0.75
    )

    current_hour = _parse_hour(request_data.get("time"))
    current_value = historical.get(current_hour, average)
    predicted_occupancy = round((current_value / maximum) * 100, 2) if maximum else 0.0
    confidence = round(min(len(historical) / 24, 1.0), 2)

    # Conditional recommendation based on busy and off-peak hours
    if busy_hours:
        recommendation = f"Station is busy {_format_hours(busy_hours)}."
        if off_peak_hours:
            recommendation += f" Best time to charge: {_format_hours(off_peak_hours)}"
    else:
        recommendation = (
            "Station generally has low occupancy throughout the day. "
            "Good time to charge anytime."
        )

    return {
        "status": "success",
        "station_id": request_data.get("station_id", ""),
        "predicted_occupancy": predicted_occupancy,
        "busy_hours": busy_hours,
        "off_peak_hours": off_peak_hours,
        "recommendation": recommendation,
        "confidence": confidence,
    }
