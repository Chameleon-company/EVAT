# Price Prediction API

Local copy of the Price Prediction FastAPI service (from
`EVAT-Data-Science/Use_Cases/Price Prediction`).

## Setup

```powershell
cd server/python-services/price_api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```powershell
uvicorn price_prediction_api:app --reload --port 8001
```

Or from the website repo root:

```powershell
npm run dev:price
```

Health: [http://127.0.0.1:8001/health](http://127.0.0.1:8001/health)

Node proxies this via `PRICE_API_URL` (default `http://localhost:8001`).