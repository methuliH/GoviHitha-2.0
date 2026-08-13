<div align="center">

# 🌾 GoviHitha

**AI crop advisory for Sri Lankan farmers — diagnose disease, check weather risk, and find local remedies in one shot.**

[![Python](https://img.shields.io/badge/python-3.11-blue)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-Vision-orange?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/methuliH/GoviHitha)](https://github.com/methuliH/GoviHitha/commits/master)

<!-- Screenshot: replace this comment with an actual screenshot once deployed -->
<!-- ![GoviHitha demo](docs/screenshot.png) -->

</div>

---

GoviHitha ("ගොවිහිත" — *Farmer's Friend* in Sinhala) is a full-stack AI advisory tool built for Sri Lankan smallholder farmers. A farmer takes a photo of their crop, describes what they see, and GoviHitha returns a disease diagnosis, live weather-based risk alerts, and product recommendations with local availability and price estimates — all in under 30 seconds.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Scope Delivered](#scope-delivered)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Gemini Vision disease diagnosis** — upload a crop photo and describe symptoms; Gemini 2.5 Flash identifies the disease, confidence level, treatment steps, and recovery timeline
- **Crop-disease plausibility check** — flags mismatches (e.g. rice image diagnosed as tomato blight) so farmers know when to re-photograph
- **Live weather risk alerts** — pulls real-time data from OpenMeteo and contextualises it against the diagnosed disease (waterlogging, high humidity, drought risk)
- **Smart Planting Advisor** — a standalone flow (crop + district only, no photo) that recommends a real, named crop variety and a sowing window from a 16-day OpenMeteo forecast
- **Live Market Price Checker** — one-tap check of today's farm-gate price vs. the recent 30-day average for a crop, with a plain-language negotiating tip; no Gemini call, so it's instant and works even offline
- **Sri Lanka-specific product recommendations** — 2–4 products with local agri-shop availability, LKR price ranges, and Google × Kapruka search links
- **Parallel agent pipeline** — CropDiagnosis runs first; WeatherAlert and ResourceRecommendation run concurrently, cutting total response time
- **Mock mode** — per-crop demo data (rice, tomato, tea, coconut, and 6 more) served without a backend — ideal for demos and UI development
- **Rate limiting** — 5 req/min per IP on the Python API; 10 req/min on the Next.js proxy
- **Graceful degradation** — every agent always returns a result; failures surface as structured error fields, never crashes

---

## Architecture

```
Browser (Next.js :3000)
        │
        │ POST /api/agents
        ▼
Next.js API route (proxy + rate limit)
        │
        │ POST /run
        ▼
FastAPI backend (:8000)
        │
        ▼
OrchestratorAgent
 ├── CropDiagnosisAgent      ← Gemini Vision (image + symptoms → diagnosis JSON)
 │        │
 │    [parallel]
 ├── WeatherAlertAgent        ← OpenMeteo fetch → Gemini risk contextualisation
 └── ResourceRecommendationAgent ← Gemini (diagnosis + weather → product JSON)
```

`PlantingAdvisorAgent` is a separate, standalone flow (`POST /advise`) — it isn't part of the
diagnosis pipeline above, since it starts from crop + district alone (no photo, no diagnosis
dependency):

```
Browser (Next.js :3000)
        │
        │ POST /api/advisor
        ▼
Next.js API route (proxy + rate limit)
        │
        │ POST /advise
        ▼
FastAPI backend (:8000)
        │
        ▼
PlantingAdvisorAgent ← OpenMeteo 16-day forecast + Gemini, grounded against a curated
                         real-variety reference dataset (agents/data/crop_varieties.json)
```

`MarketPriceAgent` (`POST /market-price`) is likewise standalone and needs only `crop_type` —
it makes **no Gemini call at all**, just a static price lookup (`agents/data/market_prices.json`)
plus a deterministic per-day calculation, so it's instant and has zero LLM cost or network
dependency.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI / Vision | Google Gemini 2.5 Flash (via `google-genai`) |
| Agent framework | Google ADK |
| Weather data | OpenMeteo API (free, no auth) |
| Backend | FastAPI + uvicorn + slowapi |
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS |
| Schema validation | Pydantic v2 |
| Containerisation | Docker (python:3.11-slim) |
| Cloud deployment | Cloud Run (backend), Vercel (frontend) |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Google Cloud project **or** a Gemini API key from [AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the repo

```bash
git clone https://github.com/methuliH/GoviHitha.git
cd GoviHitha
```

### 2. Set up the Python backend

```bash
# Create and activate a virtual environment
python -m venv agents/.venv

# Windows
agents\.venv\Scripts\Activate.ps1

# macOS / Linux
source agents/.venv/bin/activate

# Install dependencies
pip install -r agents/requirements.txt
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

---

## Configuration

### Backend — `/.env` (repo root)

Copy the example and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | One of these two | Gemini API key from AI Studio. Takes precedence over Vertex AI. |
| `GOOGLE_CLOUD_PROJECT` | One of these two | GCP project ID. Used with Vertex AI ADC when no API key is set. |
| `GOOGLE_CLOUD_REGION` | No | Defaults to `us-central1`. |

**Auth modes:**

| Mode | When | Setup |
|---|---|---|
| Gemini API key | `GOOGLE_API_KEY` is set | Get a key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Vertex AI (ADC) | `GOOGLE_API_KEY` is empty | Run `gcloud auth application-default login`, then `gcloud auth application-default set-quota-project <your-project>`. Ensure `aiplatform.googleapis.com` is enabled. |

> **Without valid credentials every Gemini call will fail immediately.** There is no silent fallback — you'll see a structured error in the response.

### Frontend — `/frontend/.env.local`

```bash
# Option A — connect to live Python backend
AGENT_URL=http://localhost:8000

# Option B — run UI only with demo data (no backend needed)
MOCK_MODE=true
```

> `AGENT_URL` takes precedence if both are set. Changing `.env.local` requires a full `npm run dev` restart — Next.js does not hot-reload it.

---

## Usage

### Start the backend

```bash
# From repo root, with venv active
python -m uvicorn agents.server:app --reload --port 8000
```

Verify:

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"govihitha-agents"}
```

### Start the frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### Smoke-test the API directly

```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "rice",
    "symptoms": "yellowing leaves with brown spots",
    "image_base64": "<base64-encoded-image>",
    "region": "Kandy"
  }'
```

### Run in mock mode (no backend)

Set `MOCK_MODE=true` in `frontend/.env.local`, then `npm run dev`. All 10 supported crops return pre-built, self-consistent demo responses tagged with `is_mock: true`.

---

## API Reference

### `GET /health`

Returns server status.

```json
{"status": "ok", "service": "govihitha-agents"}
```

### `POST /run`

Runs the full 3-agent pipeline. Rate-limited to **5 requests per minute per IP**.

**Request body:**

| Field | Type | Description |
|---|---|---|
| `crop_type` | string | e.g. `"rice"`, `"tea"`, `"tomato"` |
| `symptoms` | string | Free-text symptom description from the farmer |
| `image_base64` | string | Base64-encoded JPEG or PNG of the affected crop |
| `region` | string | Sri Lankan district, e.g. `"Kandy"`, `"Colombo"` |

<details>
<summary>Example response</summary>

```json
{
  "situation_summary": "Your rice crop in Kandy has been diagnosed with Rice Leaf Blast...",
  "diagnosis": {
    "disease_name": "Rice Leaf Blast",
    "confidence": 0.92,
    "description": "Fungal infection by Magnaporthe oryzae...",
    "treatment_steps": ["Apply Tricyclazole 75% WP at 0.6g/L..."],
    "timeline": "7–10 days with consistent treatment",
    "prevention": "Use blast-resistant varieties...",
    "risk_level": "high",
    "crop_disease_mismatch_warning": false,
    "error": null
  },
  "weather": {
    "current_weather": {"temperature": 27.8, "humidity": 82.0, "rainfall_7d": 86.2},
    "alerts": [
      {
        "risk_type": "WATERLOGGING",
        "likelihood": "high",
        "days_ahead": 2,
        "context": "Heavy rain will accelerate fungal spread...",
        "action": "Improve field drainage immediately."
      }
    ],
    "forecast_summary": "High humidity and incoming rain create elevated disease risk.",
    "error": null
  },
  "resources": {
    "recommendations": [
      {
        "type": "fungicide",
        "product_name": "Tricyclazole 75% WP",
        "why": "Directly targets Magnaporthe oryzae...",
        "availability": "Available at agri-supply shops in Kandy.",
        "estimated_cost": "1200–2500 LKR per 100g",
        "application_notes": "Mix 0.6g per litre. Apply every 7 days.",
        "kapruka_search_link": "https://www.google.com/search?q=Tricyclazole+site:kapruka.com"
      }
    ],
    "priority_note": "Buy fungicide today — rain in 48h will reduce effectiveness.",
    "error": null
  },
  "action_plan": ["Buy Tricyclazole 75% WP today...", "Apply fungicide before rain..."],
  "timeline": "7–10 days with consistent treatment",
  "error": null
}
```

</details>

### `POST /advise`

Runs `PlantingAdvisorAgent` — a standalone flow, independent of `/run`. Rate-limited to
**5 requests per minute per IP**.

**Request body:**

| Field | Type | Description |
|---|---|---|
| `crop_type` | string | e.g. `"rice"`, `"tea"`, `"tomato"` |
| `region` | string | Sri Lankan district, e.g. `"Kandy"`, `"Anuradhapura"` |

<details>
<summary>Example response</summary>

```json
{
  "crop_type": "rice",
  "region": "Anuradhapura",
  "recommended_variety": {
    "variety_name": "Bg 300",
    "reason": "Short-duration and drought-tolerant, well suited to this dry-zone district.",
    "days_to_maturity": 105
  },
  "sowing_window_label": "22 Aug - 5 Sep",
  "sowing_window_start": "2026-08-22",
  "sowing_window_end": "2026-09-05",
  "season": "Yala",
  "risk_notes": ["A dry spell is forecast in the first week — irrigate at sowing if possible."],
  "confidence": "medium",
  "advisory_summary": "Bg 300 balances a short growth cycle with drought tolerance...",
  "error": null
}
```

</details>

### `POST /market-price`

Runs `MarketPriceAgent` — a standalone, Gemini-free flow. Rate-limited to
**10 requests per minute per IP** (higher than `/run`/`/advise` since it's just a
local calculation, not an LLM call).

**Request body:**

| Field | Type | Description |
|---|---|---|
| `crop_type` | string | e.g. `"rice"`, `"tea"`, `"tomato"` |

<details>
<summary>Example response</summary>

```json
{
  "crop_type": "rice",
  "unit": "per kg (paddy)",
  "todays_price_lkr": 108.5,
  "avg_price_30d_lkr": 100.0,
  "price_change_pct": 8.5,
  "trend": "up",
  "advisory": "Prices are 9% above the recent average for rice -- a good time to sell if you have stock ready.",
  "last_updated": "2026-08-13",
  "error": null
}
```

</details>

---

## Project Structure

```
GoviHitha/
├── agents/                          # Python backend
│   ├── agents/
│   │   ├── orchestrator.py          # Runs all 3 agents; sequential then parallel
│   │   ├── crop_diagnosis.py        # Gemini Vision → disease JSON
│   │   ├── crop_disease_plausibility.py  # Mismatch guard
│   │   ├── weather_alert.py         # OpenMeteo + Gemini risk alerts
│   │   ├── resource_recommendation.py   # Gemini product recommendations
│   │   ├── planting_advisor.py      # OpenMeteo forecast + Gemini → variety/sowing-window JSON
│   │   └── market_price.py          # Static price lookup + deterministic daily calc, no Gemini
│   ├── prompts/                     # System prompts for each agent
│   ├── schemas/                     # Pydantic models (source of truth for response shape)
│   ├── tools/                       # Gemini Vision wrapper, OpenMeteo client
│   ├── data/                        # Static reference data (Hayleys products, crop varieties, market prices)
│   ├── config/                      # Settings, region coordinates, constants
│   ├── utils/                       # Logger, retry/backoff, image loader
│   ├── server.py                    # FastAPI app — POST /run, /advise, /market-price, GET /health, CORS
│   └── requirements.txt
├── frontend/                        # Next.js frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx            # Home / landing
│   │   │   ├── diagnose.tsx         # Diagnosis form (image upload + symptoms)
│   │   │   ├── results.tsx          # Results display (diagnosis + weather + products)
│   │   │   ├── advisor.tsx          # Planting Advisor form (crop + district only)
│   │   │   ├── advisor-results.tsx  # Planting Advisor results (variety + sowing window)
│   │   │   ├── market.tsx           # Market Price Checker form (crop only — single tap)
│   │   │   ├── market-results.tsx   # Market Price Checker results (today vs. 30-day avg)
│   │   │   ├── about.tsx            # About page
│   │   │   ├── api/agents.ts        # Next.js API route — proxy + mock + rate limit
│   │   │   ├── api/advisor.ts       # Next.js API route for /advise — proxy + mock + rate limit
│   │   │   └── api/market.ts        # Next.js API route for /market-price — proxy + mock + rate limit
│   │   ├── components/
│   │   ├── lib/                     # Types, API client, constants
│   │   └── styles/
│   └── package.json
├── Dockerfile                       # python:3.11-slim; 2 uvicorn workers; Cloud Run ready
├── cloudbuild.yaml                  # Cloud Build CI/CD
├── example.env                      # Environment variable template
```

---

## Scope Delivered

Notes on where the implementation deviates from the original proposal, for judges reviewing
against the submitted concept:

- **Smart Planting Advisor — variety data source.** The proposal described cross-referencing
  "historical yield data." No validated historical yield dataset for Sri Lankan crops was
  available to source and verify within the build window, so this was replaced with a curated
  reference list of real, named Sri Lankan cultivars (`agents/data/crop_varieties.json` — DOA /
  Tea Research Institute / Coconut Research Institute released varieties, or long-established
  local varieties) combined with a live 16-day OpenMeteo forecast. Gemini is constrained to pick
  only from the given variety list (a hallucination guard falls back to the first listed variety
  if it doesn't), so recommendations are always grounded in a real cultivar name. This was a
  deliberate substitution for a claim that couldn't be built honestly in time — see
  `doc/PlantingAdvisorPlan.md` for the full design rationale.
- **Delivery layer.** The proposal's primary interface was a WhatsApp bot (Meta WhatsApp Cloud
  API). This build is a web app (Next.js) instead — a full WhatsApp Cloud API integration
  requires business verification and webhook infrastructure that wasn't practical to stand up
  reliably before the deadline.
- **48-hour proactive flood/drought alerts.** Implemented as on-demand weather risk
  contextualisation within a single request/response (`WeatherAlertAgent`), not as a background
  cron job pushing unsolicited notifications — there is no persistent farmer registry or
  messaging channel to push to yet.
- **Live Market Price Checker — price data source.** The proposal said prices are "sourced
  daily from the Department of Agriculture." The Department of Agriculture / HARTI publish
  price bulletins but expose no public API, and reliable live scraping wasn't something to
  commit to blind before the deadline (the same call already made for the Hayleys product
  catalog in `resource_recommendation.py`). This build uses curated representative farm-gate
  price ranges (`agents/data/market_prices.json`) plus a deterministic per-day variation model
  (a hash of crop + today's date), so the price moves day to day and is stable within a day,
  without a live feed. See `doc/MarketPriceCheckerPlan.md` for the full rationale.
- **Persistent Personal Farm Dashboard.** Not implemented in this build — results pages remain
  single-session (`sessionStorage`), not tied to a persistent farmer identity.

---

## Deployment

### Backend → Cloud Run

```bash
# Build and push
docker build -t gcr.io/<your-project>/govihitha-agents .
docker push gcr.io/<your-project>/govihitha-agents

# Deploy
gcloud run deploy govihitha-agents \
  --image gcr.io/<your-project>/govihitha-agents \
  --region us-central1 \
  --set-env-vars GOOGLE_CLOUD_PROJECT=<your-project> \
  --set-env-vars ALLOWED_ORIGINS=https://<your-vercel-domain>.vercel.app
```

### Frontend → Vercel

```bash
cd frontend
vercel deploy --prod
# Set AGENT_URL=https://<your-cloud-run-url> in Vercel environment variables
```

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

Please keep Python agents stateless (no instance state between requests) and always return a valid schema result — never raise from an agent's public method.

---

## License

[MIT](LICENSE)
