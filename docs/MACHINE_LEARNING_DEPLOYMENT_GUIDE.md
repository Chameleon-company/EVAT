# EVAT Machine Learning Deployment Guide

**Task:** 057S1 — Create Machine Learning Deployment Guide  
**Audience:** Future EVAT students and maintainers  
**Supported environment:** Local development on macOS, Linux, or Windows; optional Docker development container

## 1. Purpose

This guide explains how to configure, train where training code is available, run, test, and troubleshoot EVAT's Python machine learning and scoring services.

The repository contains a mixture of:

- services that train a model when the API starts;
- services that load an already-trained model artifact;
- deterministic ranking or scoring services that do not train a model; and
- an offline notebook that can regenerate an artifact.

Do not assume that every committed `.pkl` or `.joblib` file can be recreated from this repository. The current limitations are recorded in [Section 7](#7-training-and-replacing-models).

## 2. Architecture and service inventory

The main Python entry point is `server/python-services/main.py`. It exposes most ML features through one FastAPI process.

| Capability                      | Implementation                         | Runtime type                                              |                  Default port | Training source in this repository |
| ------------------------------- | -------------------------------------- | --------------------------------------------------------- | ----------------------------: | ---------------------------------- |
| Weather-aware routing           | `weatherAwareRouting/`                 | Calculation plus external Google Maps and Open-Meteo APIs |                          5000 | Not applicable                     |
| Personalised EV insights        | `personalisedEVInsights/`              | Loads `kproto_bundle.pkl`                                 |                          5000 | No                                 |
| Demand forecasting              | `demandForecasting/`                   | Loads `ev_demand_model.pkl`                               |                          5000 | No                                 |
| Cost comparison                 | `costComparison/`                      | Trains and selects a model during API startup             |                          5000 | Yes                                |
| Vehicle price prediction        | `pricePrediction/`                     | Loads `price_best_model_latest.joblib`                    |                          5000 | No                                 |
| Charging-station recommendation | `charging_station_recommendation_api/` | Deterministic filtering and weighted scoring              | 5000 through the combined API | No model training required         |
| Reliability scoring             | `reliability_scoring_api/`             | Deterministic reliability and sentiment scoring           |     5000 under `/reliability` | No model training required         |
| Environmental impact model      | `environmental_impact_analysis/`       | Loads `co2_savings_model.pkl`; notebook can regenerate it | 5000 through the combined API | Yes, through the notebook          |

The Node API calls the combined Python service through `PYTHON_API_URL`. Reliability scoring is also served by that process through `RELIABILITY_API_URL=http://127.0.0.1:5000/reliability`.

### Important current behaviour

- Run the combined service from `server/python-services`. Several model and data paths are relative to that directory.
- The combined service cannot import successfully without a valid `GOOGLE_MAPS_API_KEY`, even when only a non-routing feature is being tested.
- Cost comparison training runs in memory at every combined-service startup. It does not save the selected model to disk.
- Reliability scoring and charging recommendations are scoring systems, not trained ML models.
- Price prediction, charging recommendations, and reliability scoring are all served by the combined Python process. Use `npm run dev:python`.
- There is currently no Python Dockerfile or Compose file in the repository. Section 9 provides a reproducible development-container command without claiming that EVAT has a production container image.

## 3. Prerequisites

Install:

- Git;
- uv, which manages the project's pinned Python 3.12 environment;
- Node.js 18 or newer and npm, if running the full EVAT stack;
- MongoDB access, if running the Node API; and
- Docker Desktop or Docker Engine only if using the optional Docker workflow.

Check the tools:

```bash
git --version
uv --version
node --version
npm --version
docker --version  # optional
```

All commands below assume the terminal starts in the EVAT repository root.

## 4. Install dependencies

### 4.1 Install uv

Follow the [official installation instructions](https://docs.astral.sh/uv/getting-started/installation/).
For example, use `brew install uv` on macOS with Homebrew or
`winget install --id=astral-sh.uv -e` on Windows.

### 4.2 Install the Python dependencies

Create and synchronize the Python 3.12 environment from the committed lockfile:

```bash
npm run python:sync
```

Note that uv creates `server/python-services/.venv`. It does not need to be activated separately.

### 4.3 Install full-stack dependencies

This step is only required when the React client or Node API will be run:

```bash
npm install
```

Alternatively, `npm run install:all` performs both the npm installation and the
Python synchronization.

### 4.4 Confirm important imports

```bash
cd server/python-services
uv run --locked python -c "import fastapi, uvicorn, pandas, sklearn, joblib, kmodes, lightgbm, vaderSentiment; print('Python dependencies are available')"
```

## 5. Configure the environment

Never commit real API keys, passwords, database connection strings, or credential JSON files.

### 5.1 Root environment

Create `.env` from the example:

macOS or Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Add the required backend settings. A local development example is:

```dotenv
PORT=8080
DOMAIN_URL=http://localhost
VITE_API_URL=http://localhost:8080/api

MONGODB_URI=mongodb://127.0.0.1:27017/EVAT
JWT_SECRET=replace-with-a-long-random-development-secret

PYTHON_API_URL=http://127.0.0.1:5000
RELIABILITY_API_URL=http://127.0.0.1:5000/reliability
```

### 5.2 Backend environment and Google Maps

Create `server/node-api/.env` from its example:

```bash
cp server/node-api/.env.example server/node-api/.env
```

At minimum, configure:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/EVAT
JWT_SECRET=replace-with-a-long-random-development-secret
GOOGLE_MAPS_API_KEY=replace-with-a-valid-google-maps-key
PYTHON_API_URL=http://127.0.0.1:5000
RELIABILITY_API_URL=http://127.0.0.1:5000/reliability
```

`weatherAwareRouting/config.py` explicitly reads `server/node-api/.env`. A Google key placed only in another file may therefore not be found by the combined Python service.

For weather-aware routing, enable the Google APIs used by the project, including Directions, Elevation, and Places. Apply API restrictions appropriate to the development environment.

### 5.3 Optional price prediction overrides

The defaults point to committed files under `server/python-services/pricePrediction/artifacts`. Override them only when deliberately testing replacement artifacts:

```dotenv
PRICE_MODEL_PATH=artifacts/price_best_model_latest.joblib
PRICE_DATA_PATH=artifacts/car_price_enriched_latest.csv
PRICE_FEATURE_DICT_PATH=artifacts/feature_dictionary.csv
```

Relative price paths are resolved from `server/python-services/pricePrediction`.

### 5.4 Optional reliability settings

Defaults are suitable for local use:

```dotenv
RELIABILITY_DATA_PATH=data/EVAT-Final-Enriched.csv
RELIABILITY_STATUS_WEIGHT=0.6
RELIABILITY_POWER_WEIGHT=0.4
```

When set from the repository root, use an absolute path for `RELIABILITY_DATA_PATH` to avoid ambiguity. The default path is already resolved relative to the reliability service.

### 5.5 Validate artifacts before startup

macOS or Linux:

```bash
test -f server/python-services/personalisedEVInsights/kproto_bundle.pkl
test -f server/python-services/demandForecasting/ev_demand_model.pkl
test -f server/python-services/pricePrediction/artifacts/price_best_model_latest.joblib
test -f server/python-services/environmental_impact_analysis/co2_savings_model.pkl
test -f server/python-services/reliability_scoring_api/data/EVAT-Final-Enriched.csv
echo "Required ML assets are present"
```

Only load pickle or Joblib artifacts obtained from a trusted EVAT source. These formats can execute code while loading.

## 6. Run the services locally

### 6.1 Combined ML service

Run from the repository root:

```bash
npm run dev:python
```

Equivalent direct command:

```bash
cd server/python-services
uv run --locked python -m uvicorn main:app --host 127.0.0.1 --port 5000 --reload
```

Wait for the following startup stages:

1. committed artifacts and data are imported;
2. the cost-comparison candidates are trained and evaluated;
3. the best cost-comparison model is selected;
4. the price model and feature schema are loaded; and
5. Uvicorn reports that application startup is complete.

Open:

- API root: `http://127.0.0.1:5000/`
- Swagger UI: `http://127.0.0.1:5000/docs`
- OpenAPI JSON: `http://127.0.0.1:5000/openapi.json`

### 6.2 Charging-station recommendation service

The recommendation endpoint is mounted in the combined service:

```bash
curl http://127.0.0.1:5000/docs
```

Use `POST /charging-station-recommendations/rank`. The recommendation feature
is intentionally part of the combined API and has no standalone process.

### 6.3 Reliability scoring service

Reliability scoring is included in the combined Python service:

```bash
npm run dev:python
```

Open `http://127.0.0.1:5000/reliability/health` and
`http://127.0.0.1:5000/docs`.

### 6.4 Full EVAT stack

With MongoDB and all environment variables configured:

```bash
npm run dev
```

This starts the React client, Node API, and consolidated Python service,
including reliability scoring.

The usual local addresses are:

- React client: the URL printed by Vite, commonly `http://localhost:3000` or `http://localhost:5173`;
- Node API: `http://localhost:8080`;
- Node Swagger UI: `http://localhost:8080/api/docs`;
- combined Python API: `http://127.0.0.1:5000` (including reliability under `/reliability`).

For a non-reloading local deployment, remove `--reload`:

```bash
cd server/python-services
uv run --locked python -m uvicorn main:app --host 127.0.0.1 --port 5000 --workers 1
```

Use one worker for the current combined application because each worker independently trains and stores the cost-comparison model in memory.

## 7. Training and replacing models

### 7.1 Cost-comparison model: training is supported

Training data:

```text
server/python-services/costComparison/data/dummy_data.csv
```

Run the training selection manually:

```bash
cd server/python-services
uv run --locked python -c "from costComparison.model_runner import load_and_train, get_model_name; load_and_train('costComparison/data/dummy_data.csv'); print('Selected model:', get_model_name())"
```

The pipeline compares Gradient Boosting, Random Forest, and Ridge using a fixed train/test split and selects the highest test R². The selected model remains only in that Python process. Restarting the API retrains it.

Before replacing the CSV:

1. retain all columns referenced by `FEATURES` and the target `savings_ice_minus_ev`;
2. validate units and missing values;
3. keep a copy of the original data;
4. record the dataset source and licence;
5. run the manual training command and compare R² values; and
6. exercise the cost-comparison endpoints before committing the dataset.

### 7.2 Environmental impact model: notebook training is supported

The notebook `server/python-services/environmental_impact_analysis/Clean_Model_Code.ipynb` trains and writes `co2_savings_model.pkl`.

Run Jupyter as a one-off tool from the environmental feature directory:

```bash
cd server/python-services/environmental_impact_analysis
uv run --project .. --with jupyterlab python -m jupyter lab Clean_Model_Code.ipynb
```

Run all notebook cells from top to bottom. Confirm that the final artifact is created in the same directory:

```bash
uv run --locked --project .. python predict.py
```

The environmental model is mounted at `POST /environmentalImpact/predict` in
the combined FastAPI application. `predict.py` is also an offline verification
utility.

### 7.3 Artifact-only models: training is not reproducible here

The following artifacts have inference code but no complete training pipeline in this repository:

- `personalisedEVInsights/kproto_bundle.pkl`;
- `demandForecasting/ev_demand_model.pkl`; and
- `pricePrediction/artifacts/price_best_model_latest.joblib`.

To replace one safely:

1. obtain the matching training project, dataset, feature definitions, and dependency versions;
2. train outside the inference service;
3. preserve the exact feature names, order, categories, transformations, and target semantics;
4. record dataset and code versions plus evaluation metrics;
5. write the new artifact to a temporary filename;
6. start the service with the new artifact path where an override is supported;
7. run schema, health, and representative prediction checks; and
8. replace the committed artifact only after review.

For price prediction, use `PRICE_MODEL_PATH` to test a candidate without
overwriting the current model. Test other replacements on a branch and retain
the original files.

### 7.4 Non-training services

Charging recommendations and reliability scoring use explicit formulas and rules. Changes to weights or thresholds are code/configuration changes, not model retraining. Validate those changes with tests and representative inputs.

## 8. Verify the deployment

### 8.1 Basic service checks

```bash
curl --fail http://127.0.0.1:5000/
curl --fail http://127.0.0.1:5000/pricePrediction/health
curl --fail http://127.0.0.1:5000/reliability/health
```

Only run checks for services that were started.

### 8.2 Cost comparison smoke test

```bash
curl --fail -X POST http://127.0.0.1:5000/costComparison/predict \
  -H "Content-Type: application/json" \
  -d '{
    "distance_km": 100,
    "electricity_price_per_kwh": 0.30,
    "petrol_price_per_l": 2.00
  }'
```

### 8.3 Demand forecasting smoke test

First list supported postcodes:

```bash
curl --fail http://127.0.0.1:5000/demandForecasting/postcodes
```

Then submit a supported postcode and a date between tomorrow and 16 days from today:

```bash
curl --fail -X POST http://127.0.0.1:5000/demandForecasting/predict \
  -H "Content-Type: application/json" \
  -d '{"postcode":"3000","date":"YYYY-MM-DD"}'
```

### 8.4 Reliability scoring smoke test

```bash
curl --fail -X POST http://127.0.0.1:5000/reliability/score \
  -H "Content-Type: application/json" \
  -d '{"station_id":"test-1","status":"Operational","power_kw":150,"max_power_kw":350}'
```

### 8.5 Automated tests

Run all Python tests from the repository root:

```bash
npm run test:python
```

Run the full-stack backend tests separately from the repository root:

```bash
npm run test:server
```

## 9. Docker usage

### 9.1 Current Docker support

The repository currently contains only `server/node-api/Dockerfile`. That image builds the Node API and does not package the Python ML services. There is no committed Python Dockerfile or Docker Compose definition.

The following one-off container is suitable for local verification of the combined Python service. It mounts the working tree into a disposable Python 3.12 container. Because the project is bind-mounted, `uv sync` may create or update the ignored `server/python-services/.venv` directory on the host.

macOS or Linux:

```bash
docker run --rm -it \
  --name evat-ml \
  -p 5000:5000 \
  --env-file server/node-api/.env \
  -v "$PWD:/workspace" \
  -w /workspace/server/python-services \
  python:3.12-slim \
  sh -lc "apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/* && pip install --no-cache-dir uv && uv sync --locked && uv run python -m uvicorn main:app --host 0.0.0.0 --port 5000"
```

Windows PowerShell:

```powershell
docker run --rm -it `
  --name evat-ml `
  -p 5000:5000 `
  --env-file server/node-api/.env `
  -v "${PWD}:/workspace" `
  -w /workspace/server/python-services `
  python:3.12-slim `
  sh -lc "apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/* && pip install --no-cache-dir uv && uv sync --locked && uv run python -m uvicorn main:app --host 0.0.0.0 --port 5000"
```

Verify from the host:

```bash
curl --fail http://127.0.0.1:5000/
```

Notes:

- This command installs packages every time. Create a reviewed Python Dockerfile before using containers routinely or in production.
- Do not bake `.env` files or credentials into an image.
- Mounting the repository is appropriate for local development, not production.
- If the Node API runs on the host, `PYTHON_API_URL=http://127.0.0.1:5000` works. If Node runs in another container, both containers need a shared Docker network and the URL must use the Python container's service name.
- A production image should pin dependency versions, copy only required source and artifacts, run as a non-root user, include a health check, and use a controlled artifact release process.

## 10. Troubleshooting

### `ValueError: Must provide API key or enterprise credentials`

Cause: `GOOGLE_MAPS_API_KEY` is empty or not available when `weatherAwareRouting` is imported.

Fix:

1. put a valid key in `server/node-api/.env`;
2. do not leave a placeholder value;
3. restart the Python process; and
4. confirm the required Google APIs are enabled for the key.

### Port 5000 is already in use

If port 5000 is already in use, run Python on another port:

```bash
cd server/python-services
uv run --locked python -m uvicorn main:app --host 127.0.0.1 --port 5001 --reload
```

Set the Node API to the same address:

```dotenv
PYTHON_API_URL=http://127.0.0.1:5001
```

Because `npm run dev:python` hard-codes port 5000, start the client, Node API, and Python service in separate terminals when using port 5001.

Find the process using a port:

```bash
lsof -nP -iTCP:5000 -sTCP:LISTEN  # macOS/Linux
```

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen  # Windows PowerShell
```

### `FileNotFoundError` for a model, CSV, or feature file

Cause: a required artifact is missing or an override environment variable points
to an invalid file.

Fix: run `npm run test:python` to exercise the artifact-loading smoke tests, then
check that all committed artifacts are present.

### `uv: command not found` or a missing Python module

Install uv, then synchronize the locked environment:

```bash
npm run python:sync
```

Do not install missing application modules individually with pip. Add legitimate
dependencies to `pyproject.toml` and update the lockfile instead.

### A pickle or Joblib artifact fails to load

Model artifacts can depend on the Python and library versions used during training.

The currently committed artifacts contain estimators serialized by different
scikit-learn versions (1.8 and 1.9). The project initially locks scikit-learn
1.8 because the price pipeline depends on it, but the environmental artifact
may emit compatibility warnings until the ML team supplies matching training
metadata or re-exports the models from one agreed environment.

1. use the locked Python 3.12 environment;
2. recreate `.venv` with `npm run python:sync` rather than mixing global packages;
3. run the model artifact smoke tests;
4. confirm the artifact was not truncated; and
5. obtain the training environment metadata from the artifact owner if incompatibility remains.

Never download an untrusted replacement artifact merely to bypass the error.

### Combined API appears to pause during startup

Cost comparison trains three candidate models at startup. Wait for the model R² output, selected-model message, price-model load, and Uvicorn startup completion. Avoid `--reload` while diagnosing repeated training.

### Demand forecast returns a date error

The weather integration accepts future dates only, up to 16 days ahead. Use a postcode returned by `/demandForecasting/postcodes` and a supported future date. The service falls back to 20°C when Open-Meteo cannot be reached.

### Price or charging recommendation endpoints are unavailable

Both features are mounted in the combined Python service. Start it with:

```bash
npm run dev:python
```

Then use the `/pricePrediction/*` endpoints or `POST /charging-station-recommendations/rank`.

### Node returns a Python connection error

Confirm that:

- the combined Python service is running;
- `PYTHON_API_URL` exactly matches its host and port;
- reliability uses `RELIABILITY_API_URL=http://127.0.0.1:5000/reliability`;
- Docker-hosted services publish their ports; and
- the environment was loaded before the Node process started.

### Docker cannot load LightGBM or XGBoost

Linux containers may require the OpenMP runtime. The example command installs `libgomp1`. Rebuild the environment after adding it, and ensure the host architecture has compatible package wheels.

## 11. Student handover checklist

Before marking an ML deployment change complete:

- [ ] Record the Python version and dependency changes.
- [ ] Keep secrets out of Git and update only `.env.example` placeholders when configuration changes.
- [ ] Record the source, licence, date, and preprocessing steps for new data.
- [ ] Record model type, feature schema, evaluation metrics, and random seed.
- [ ] Preserve or tag the previous working artifact.
- [ ] Verify model and data paths from the documented working directory.
- [ ] Run health checks and representative prediction requests.
- [ ] Run available automated tests.
- [ ] Test the Node-to-Python integration when its contract changes.
- [ ] Update this guide when ports, scripts, paths, or dependencies change.

## 12. Quick command reference

```bash
# Install all JavaScript and Python dependencies
npm run install:all

# Synchronize only the locked Python environment
npm run python:sync

# Run combined ML service
npm run dev:python

# Run the full EVAT application
npm run dev

# Verify
curl --fail http://127.0.0.1:5000/
curl --fail http://127.0.0.1:5000/pricePrediction/health
curl --fail http://127.0.0.1:5000/reliability/health

# Run all Python tests
npm run test:python
```
