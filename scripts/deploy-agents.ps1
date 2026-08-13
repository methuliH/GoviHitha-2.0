# deploy-agents.ps1
# One-shot deployment: build Docker image → Artifact Registry → Cloud Run.
# Run once to bootstrap; afterwards Cloud Build triggers handle CI deploys.
#
# Prerequisites:
#   gcloud auth login
#   gcloud auth configure-docker us-central1-docker.pkg.dev
#   $env:GOOGLE_API_KEY set (or use ADC — leave it empty)
#
# Usage:
#   cd D:\GoviHitha
#   .\scripts\deploy-agents.ps1
#   .\scripts\deploy-agents.ps1 -Project my-project -Region asia-southeast1

param(
    [string]$Project = "researchbrain-497600",
    [string]$Region  = "us-central1",
    [string]$Service = "govihitha-agents",
    [string]$Repo    = "govihitha"
)

$ErrorActionPreference = "Stop"

$IMAGE = "$Region-docker.pkg.dev/$Project/$Repo/agents:latest"

Write-Host "`n=== GoviHitha — Agent Backend Deployment ===" -ForegroundColor Green
Write-Host "Project : $Project"
Write-Host "Region  : $Region"
Write-Host "Service : $Service"
Write-Host "Image   : $IMAGE`n"

# ── 1. Enable required APIs ─────────────────────────────────────────────────
Write-Host ">> Enabling Cloud APIs..." -ForegroundColor Cyan
gcloud services enable `
    run.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    secretmanager.googleapis.com `
    --project $Project --quiet

# ── 2. Artifact Registry repo ────────────────────────────────────────────────
Write-Host ">> Creating Artifact Registry repo (skips if exists)..." -ForegroundColor Cyan
gcloud artifacts repositories create $Repo `
    --repository-format=docker `
    --location=$Region `
    --project=$Project `
    --quiet 2>$null
# ignore "already exists" error — $? may be false but we continue
Write-Host "   Repo '$Repo' ready."

# ── 3. Configure Docker auth ─────────────────────────────────────────────────
Write-Host ">> Configuring Docker auth for Artifact Registry..." -ForegroundColor Cyan
gcloud auth configure-docker "$Region-docker.pkg.dev" --quiet

# ── 4. Build image ───────────────────────────────────────────────────────────
Write-Host ">> Building Docker image..." -ForegroundColor Cyan
docker build -t $IMAGE .

# ── 5. Push image ────────────────────────────────────────────────────────────
Write-Host ">> Pushing image to Artifact Registry..." -ForegroundColor Cyan
docker push $IMAGE

# ── 6. Store API key in Secret Manager (if provided) ─────────────────────────
if ($env:GOOGLE_API_KEY) {
    Write-Host ">> Storing GOOGLE_API_KEY in Secret Manager..." -ForegroundColor Cyan
    $keyExists = gcloud secrets describe govihitha-api-key --project=$Project 2>$null
    if (-not $keyExists) {
        gcloud secrets create govihitha-api-key --project=$Project --replication-policy=automatic --quiet
    }
    $env:GOOGLE_API_KEY | gcloud secrets versions add govihitha-api-key --data-file=- --project=$Project
} else {
    Write-Host "   GOOGLE_API_KEY not set — will use Workload Identity / ADC." -ForegroundColor Yellow
}

# ── 7. Deploy to Cloud Run ───────────────────────────────────────────────────
Write-Host ">> Deploying to Cloud Run..." -ForegroundColor Cyan

$deployArgs = @(
    "run", "deploy", $Service,
    "--image=$IMAGE",
    "--region=$Region",
    "--platform=managed",
    "--allow-unauthenticated",
    "--memory=1Gi",
    "--cpu=1",
    "--timeout=120",
    "--concurrency=10",
    "--min-instances=0",
    "--max-instances=5",
    "--project=$Project",
    "--quiet"
)

if ($env:GOOGLE_API_KEY) {
    $deployArgs += "--set-secrets=GOOGLE_API_KEY=govihitha-api-key:latest"
} else {
    # Grant the Cloud Run service account access to Vertex AI
    $saEmail = "$Project-compute@developer.gserviceaccount.com"
    Write-Host "   Granting Vertex AI access to $saEmail" -ForegroundColor Yellow
    gcloud projects add-iam-policy-binding $Project `
        --member="serviceAccount:$saEmail" `
        --role="roles/aiplatform.user" `
        --quiet
    $deployArgs += "--set-env-vars=GOOGLE_CLOUD_PROJECT=$Project,GOOGLE_CLOUD_REGION=$Region"
}

gcloud @deployArgs

# ── 8. Print service URL ─────────────────────────────────────────────────────
$url = gcloud run services describe $Service `
    --region=$Region --project=$Project `
    --format="value(status.url)"

Write-Host "`n=== Deployment complete ===" -ForegroundColor Green
Write-Host "Service URL : $url" -ForegroundColor Yellow
Write-Host "`nNext steps:"
Write-Host "  1. Set AGENT_URL=$url in your Vercel frontend environment variables."
Write-Host "  2. Set ALLOWED_ORIGINS=https://your-app.vercel.app on the Cloud Run service."
Write-Host "  3. Run: gcloud run services update $Service --region=$Region --set-env-vars=ALLOWED_ORIGINS=https://your-app.vercel.app`n"
