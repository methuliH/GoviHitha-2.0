# GoviHitha — Agent Guide

AI crop advisory for Sri Lankan farmers. Two processes must run simultaneously for the full stack to work.

## Architecture

```
frontend (Next.js :3000)  →  POST /api/agents  →  Next.js API route
                                                         │
                                          (if AGENT_URL set)
                                                         ↓
                               Python backend (FastAPI :8000)  →  OrchestratorAgent
                                                                        ├── CropDiagnosisAgent  (Gemini Vision)
                                                                        ├── WeatherAlertAgent   (OpenMeteo + Gemini)
                                                                        └── ResourceRecommendationAgent (Gemini)
```

## Environment Files

Two separate files — do NOT confuse them:

| File | Location | Read by | Required contents |
|---|---|---|---|
| `.env` | repo root (`D:\GoviHitha\.env`) | Python backend | `GOOGLE_API_KEY=<real key>` |
| `.env.local` | `frontend/.env.local` | Next.js | `AGENT_URL=http://localhost:8000` OR `MOCK_MODE=true` |

- Get a real Gemini API key from https://aistudio.google.com/apikey
- Without a real `GOOGLE_API_KEY`, every `/run` call will hang indefinitely (falls back to Vertex AI ADC, which waits for credentials that aren't there)
- `MOCK_MODE=true` runs the frontend with per-crop demo data — no Python backend needed
- `AGENT_URL` and `MOCK_MODE` are mutually exclusive; `AGENT_URL` takes precedence if both are set

## Starting the Stack

### Python backend (terminal 1 — from repo root)

```powershell
agents\.venv\Scripts\Activate.ps1
python -m uvicorn agents.server:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok","service":"govihitha-agents"}`

### Frontend (terminal 2 — from frontend/)

```powershell
cd frontend
npm run dev
# → http://localhost:3000
```

## Common Errors and Fixes

### 500 on startup / ENOENT `_document.js`
The `.next` build cache is stale. Fix:
```powershell
Remove-Item -Recurse -Force frontend\.next
# then restart: npm run dev
```

### Frontend starts on 3001 or 3002 instead of 3000
Stale Next.js processes are holding port 3000. Find and kill them:
```powershell
netstat -ano | findstr ":3000"
# note the PID in the last column, then:
Stop-Process -Id <PID> -Force
```
Then restart `npm run dev`.

### POST /run hangs / times out (no response after 30+ s)
`GOOGLE_API_KEY` is missing or still the placeholder in `.env`. The backend falls back to Vertex AI ADC and waits indefinitely for GCP credentials. Add a real key and restart the backend.

### Frontend returns 503 "Diagnosis service is not configured"
`frontend/.env.local` has neither `AGENT_URL` nor `MOCK_MODE=true`. Add one and restart `npm run dev`.

### `frontend/.env.local` change not picked up
Next.js does not hot-reload `.env.local`. Always do a full restart (`Ctrl+C` + `npm run dev`) after editing it.

## Key Files

| Path | Purpose |
|---|---|
| `agents/server.py` | FastAPI app — `POST /run`, `GET /health`, CORS |
| `agents/agents/orchestrator.py` | Runs all 3 agents; always returns, never raises |
| `agents/agents/crop_diagnosis.py` | Gemini Vision call + JSON parse |
| `agents/agents/weather_alert.py` | OpenMeteo fetch + Gemini risk contextualisation |
| `agents/agents/resource_recommendation.py` | Gemini product recommendations |
| `agents/schemas/orchestrator_schema.py` | Pydantic `OrchestrationResult` — source of truth for response shape |
| `frontend/src/pages/api/agents.ts` | Next.js API route — proxies to backend or serves mock |
| `frontend/src/lib/types.ts` | TypeScript interfaces — must stay in sync with Python schemas |
| `frontend/src/lib/api.ts` | `submitQuery()` — frontend → `/api/agents` |

## Request / Response Shape

Frontend sends to `POST ${AGENT_URL}/run`:
```json
{ "crop_type": "rice", "symptoms": "...", "image_base64": "<base64>", "region": "Kandy" }
```

Backend returns `OrchestrationResult` (see `agents/schemas/orchestrator_schema.py` and `frontend/src/lib/types.ts` — these must stay in sync).

## Smoke-test (backend in isolation)

```powershell
$body = @{
  crop_type    = "rice"
  symptoms     = "yellowing leaves with brown spots"
  image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  region       = "Kandy"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/run" -Method POST `
  -ContentType "application/json" -Body $body -TimeoutSec 90 |
  Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

Note: the test image is a 1×1 blank pixel — Gemini will correctly return `"Unable to Diagnose"`. Use a real crop photo for a real diagnosis.

## Deployment (future)

- Backend → Cloud Run (`PORT` env var, `ALLOWED_ORIGINS` env var for CORS)
- Frontend → Vercel (`AGENT_URL` set to the Cloud Run service URL)
