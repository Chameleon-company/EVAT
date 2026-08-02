# Charging Station Recommendation API

FastAPI service that filters and ranks EV charging-station candidates.

## Setup

```powershell
cd server/python-services/charging_station_recommendation_api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

From the repository root:

```powershell
npm run dev:charging-recommendation
```

Or from this service folder:

```powershell
uvicorn main:app --reload --port 8002
```

Health: [http://127.0.0.1:8002/health](http://127.0.0.1:8002/health)

Swagger docs: [http://127.0.0.1:8002/docs](http://127.0.0.1:8002/docs)

## Endpoint

`POST /charging-station-recommendations/rank`

The Node API supplies enriched station candidates, the user profile, and their
recommendation history. This service filters ineligible stations, applies the
current fixed-weight ranking, and returns ranked station IDs, scores, and
reasons.

## Tests

```powershell
pytest
```
