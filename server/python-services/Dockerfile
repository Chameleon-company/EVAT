# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# EVAT combined Python ML service (FastAPI, server/python-services/main.py)
# Build context: repository root (needs python-requirements.txt)
#   docker build -f server/python-services/Dockerfile .
# ---------------------------------------------------------------------------
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# libgomp1 is required by LightGBM and XGBoost; curl is used by the healthcheck.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependency layer first so code changes don't re-install the ML stack.
COPY python-requirements.txt ./python-requirements.txt
RUN pip install --no-cache-dir -r python-requirements.txt

# main.py and its packages load models with paths relative to the process CWD
# (e.g. "demandForecasting/ev_demand_model.pkl", "costComparison/data/..."),
# so the contents of python-services must sit directly in WORKDIR.
COPY server/python-services/ ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=240s --retries=5 \
  CMD curl --fail http://127.0.0.1:5000/ || exit 1

# Bind to 0.0.0.0 - 127.0.0.1 inside a container is not reachable from
# other containers or from the host.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
