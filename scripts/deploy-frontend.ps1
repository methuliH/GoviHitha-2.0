# deploy-frontend.ps1
# Deploy the Next.js frontend to Vercel.
#
# Prerequisites:
#   npm install -g vercel
#   vercel login
#
# Usage:
#   cd D:\GoviHitha
#   .\scripts\deploy-frontend.ps1 -AgentUrl https://govihitha-agents-xxx.run.app
#   .\scripts\deploy-frontend.ps1 -AgentUrl https://... -Prod

param(
    [Parameter(Mandatory=$true)]
    [string]$AgentUrl,

    [switch]$Prod
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== GoviHitha — Frontend Deployment ===" -ForegroundColor Green
Write-Host "Agent URL : $AgentUrl"
Write-Host "Mode      : $(if ($Prod) { 'Production' } else { 'Preview' })`n"

# Change to frontend directory
Set-Location "$PSScriptRoot\..\frontend"

# Set the AGENT_URL environment variable on Vercel
Write-Host ">> Setting AGENT_URL on Vercel..." -ForegroundColor Cyan
$AgentUrl | vercel env add AGENT_URL production --yes 2>$null
$AgentUrl | vercel env add AGENT_URL preview --yes 2>$null

# Deploy
Write-Host ">> Deploying to Vercel..." -ForegroundColor Cyan
if ($Prod) {
    $deployUrl = vercel --prod --yes
} else {
    $deployUrl = vercel --yes
}

Write-Host "`n=== Deployment complete ===" -ForegroundColor Green
Write-Host "Frontend URL : $deployUrl" -ForegroundColor Yellow
Write-Host "`nNext steps:"
Write-Host "  Update ALLOWED_ORIGINS on Cloud Run to include $deployUrl"
Write-Host "  gcloud run services update govihitha-agents --region=us-central1 --set-env-vars=ALLOWED_ORIGINS=$deployUrl`n"
