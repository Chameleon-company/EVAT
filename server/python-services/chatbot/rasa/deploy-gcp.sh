#!/bin/bash
# ============================================================
# EVAT Chatbot — Google Cloud Run Deployment Script
# ============================================================
# Prerequisites:
#   gcloud CLI installed and authenticated
#   Docker installed and running
#   Run: gcloud auth login && gcloud auth configure-docker
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHATBOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── Configuration ────────────────────────────────────────────
PROJECT_ID="sit-26t1-rasa-chatbot-5c0c042"
REGION="australia-southeast1"             # Melbourne-closest GCP region
ACTIONS_SERVICE="evat-actions"
RASA_SERVICE="evat-rasa"
AR_REPO="evat-chatbot"
IMAGE_REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"

# Load TomTom key from .env (gitignored — key stays off GitHub)
[ -f "$(dirname "$0")/.env" ] && export $(grep -v '^#' "$(dirname "$0")/.env" | xargs)
TOMTOM_KEY="${TOMTOM_API_KEY:-}"

# ── Step 1: Enable required GCP APIs ────────────────────────
echo "Enabling GCP APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com --project="${PROJECT_ID}"

# ── Step 1b: Create Artifact Registry repo (safe to run if it already exists) ──
echo "Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories describe "${AR_REPO}" \
  --location="${REGION}" --project="${PROJECT_ID}" > /dev/null 2>&1 || \
gcloud artifacts repositories create "${AR_REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT_ID}"

# ── Step 1c: Configure Docker for Artifact Registry ─────────
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# ── Step 2: Build and push Actions Server image ─────────────
echo "Building actions server image..."
docker build --platform=linux/amd64 -f "${SCRIPT_DIR}/Dockerfile.actions" -t "${IMAGE_REGISTRY}/${ACTIONS_SERVICE}:latest" "${CHATBOT_DIR}"
docker push "${IMAGE_REGISTRY}/${ACTIONS_SERVICE}:latest"

# ── Step 3: Deploy Actions Server to Cloud Run ───────────────
echo "Deploying actions server..."
gcloud run deploy "${ACTIONS_SERVICE}" \
  --image="${IMAGE_REGISTRY}/${ACTIONS_SERVICE}:latest" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --port=5055 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="TOMTOM_API_KEY=${TOMTOM_KEY}"

echo "Setting IAM policy for actions server..."
gcloud run services add-iam-policy-binding "${ACTIONS_SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --member=allUsers \
  --role=roles/run.invoker 2>/dev/null || \
  echo "Note: Could not set allUsers invoker — service may require authentication."

# ── Step 4: Get the Actions Server URL ───────────────────────
ACTIONS_URL=$(gcloud run services describe "${ACTIONS_SERVICE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")

echo "Actions server deployed at: ${ACTIONS_URL}"

# ── Step 5: Build and push Rasa Server image ─────────────────
echo "Building Rasa server image..."
docker build --platform=linux/amd64 -f "${SCRIPT_DIR}/Dockerfile.rasa" -t "${IMAGE_REGISTRY}/${RASA_SERVICE}:latest" "${CHATBOT_DIR}"
docker push "${IMAGE_REGISTRY}/${RASA_SERVICE}:latest"

# ── Step 6: Deploy Rasa Server to Cloud Run ──────────────────
echo "Deploying Rasa server..."
gcloud run deploy "${RASA_SERVICE}" \
  --image="${IMAGE_REGISTRY}/${RASA_SERVICE}:latest" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --port=5005 \
  --memory=4Gi \
  --cpu=2 \
  --min-instances=1 \
  --max-instances=3 \
  --timeout=300 \
  --set-env-vars="RASA_ACTIONS_URL=${ACTIONS_URL}"

echo "Setting IAM policy for Rasa server..."
gcloud run services add-iam-policy-binding "${RASA_SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --member=allUsers \
  --role=roles/run.invoker 2>/dev/null || \
  echo "Note: Could not set allUsers invoker — service may require authentication."

# ── Step 7: Print final URLs ──────────────────────────────────
RASA_URL=$(gcloud run services describe "${RASA_SERVICE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")

echo ""
echo "============================================================"
echo "DEPLOYMENT COMPLETE"
echo "============================================================"
echo "Rasa API URL:    ${RASA_URL}"
echo "Actions URL:     ${ACTIONS_URL}"
echo ""
echo "Your webhook endpoint (use this in your website):"
echo "  ${RASA_URL}/webhooks/rest/webhook"
echo ""
echo "Test it with:"
echo "  curl -X POST ${RASA_URL}/webhooks/rest/webhook \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"sender\": \"test\", \"message\": \"hello\"}'"
echo "============================================================"
