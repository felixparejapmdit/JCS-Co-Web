#!/bin/bash
# AOS100 NextGen Firebase Deployment Script (Bash / Linux)
set -e

PROJECT_ID="${1:-aos100-jcs}"
REGION="${2:-asia-east1}"
IMAGE_TAG="${3:-latest}"

echo "=== AOS100 NextGen: Starting Firebase / Cloud Run Deployment ==="
echo "Target GCP Project: $PROJECT_ID"
echo "Target Region:      $REGION"

IMAGE_NAME="gcr.io/$PROJECT_ID/aos100-web:$IMAGE_TAG"

echo "[1/3] Building Next.js 15 Full-Stack Container: $IMAGE_NAME..."
docker build -t "$IMAGE_NAME" .

echo "[2/3] Pushing Image to Google Artifact Registry..."
docker push "$IMAGE_NAME"

echo "[3/3] Deploying to Google Cloud Run service 'aos100-web'..."
gcloud run deploy aos100-web \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --project "$PROJECT_ID"

echo "Releasing Firebase Hosting Edge Routes..."
npx firebase-tools deploy --only hosting --project "$PROJECT_ID"

echo "Deployment Successful! Public URL: https://$PROJECT_ID.web.app"
