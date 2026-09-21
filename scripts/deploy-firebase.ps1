# AOS100 NextGen Firebase Deployment Script (PowerShell)
param (
    [string]$ProjectId = "aos100-jcs",
    [string]$Region = "asia-east1",
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "=== AOS100 NextGen: Starting Firebase / Cloud Run Deployment ===" -ForegroundColor Cyan
Write-Host "Target GCP Project: $ProjectId"
Write-Host "Target Region:      $Region"

# Step 1: Build Docker Container
$ImageName = "gcr.io/$ProjectId/aos100-web:$ImageTag"
Write-Host "`n[1/3] Building Next.js 15 Full-Stack Container: $ImageName..." -ForegroundColor Yellow
docker build -t $ImageName .

# Step 2: Push to Google Artifact Registry
Write-Host "`n[2/3] Pushing Image to Google Artifact Registry..." -ForegroundColor Yellow
docker push $ImageName

# Step 3: Deploy to Cloud Run
Write-Host "`n[3/3] Deploying to Google Cloud Run service 'aos100-web'..." -ForegroundColor Yellow
gcloud run deploy aos100-web `
    --image $ImageName `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --project $ProjectId

# Step 4: Release Firebase Hosting CDN edge rules
Write-Host "`nReleasing Firebase Hosting Edge Routes..." -ForegroundColor Yellow
npx firebase-tools deploy --only hosting --project $ProjectId

Write-Host "`n Deployment Successful! Public URL: https://$ProjectId.web.app" -ForegroundColor Green
