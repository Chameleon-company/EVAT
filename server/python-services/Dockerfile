FROM python:3.10-slim

WORKDIR /app

# Install build tools for packages that need compiling
RUN apt-get update && apt-get install -y --no-install-recommends build-essential gcc && rm -rf /var/lib/apt/lists/*

# Copy source
COPY . .

# Install Python requirements from the multiple service requirement files
RUN pip install --no-cache-dir -r charging_station_recommendation_api/requirements.txt \
    -r reliability_scoring_api/requirements.txt \
    -r personalisedEVInsights/requirements.txt \
    -r environmental_impact_analysis/requirements.txt

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
