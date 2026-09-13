# syntax=docker/dockerfile:1
# EVAT combined Python ML service (FastAPI)
# Build context: server/python-services
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# libgomp1 is required by LightGBM and XGBoost; curl is used by the healthcheck.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Models load via CWD-relative paths, so the service must sit directly in WORKDIR.
COPY . ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=240s --retries=5 \
  CMD curl --fail http://127.0.0.1:5000/ || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
