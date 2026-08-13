# Smart Planting Advisor — Implementation Plan

Goal: add the 4th agent named in the HackElite proposal (crop variety + sowing-window
recommendation) as a new, independent agent that follows the exact pattern already
used by `WeatherAlertAgent`, so it's low-risk to build and easy for judges to recognise
as consistent with the rest of the codebase.

## 1. Scope decision — what we're actually building

The proposal claims the advisor "cross-references **historical yield data**" with
forecasts. That historical yield dataset does not exist and isn't feasible to source
and validate before the deadline. Building it honestly means:

- Use OpenMeteo's forecast (same tool already used by `WeatherAlertAgent`, extended
  to its max 16-day range) for near-term rainfall/temperature outlook.
- Use a small **curated reference dataset of real Sri Lankan crop varieties**
  (`agents/data/crop_varieties.json`) — drought-tolerant / flood-tolerant / days-to-maturity
  per variety — so Gemini picks from grounded facts instead of hallucinating variety names.
- Bake Sri Lankan agro-climate domain knowledge (Maha/Yala seasons, dry/wet zone
  behaviour) into the system prompt, same technique already used in
  `weather_alert_prompt.py`.

This is a **defensible substitution**, not the literal proposal claim. It must be stated
plainly in the README's "Scope Delivered" section: *"Historical yield cross-referencing
was replaced with a curated real-variety reference dataset + 16-day forecast, because a
validated historical yield dataset wasn't available in the build window."*

## 2. Where it fits in the architecture

This is **not** wired into `OrchestratorAgent`. The proposal describes it as a
season-start flow triggered by location alone (no photo, no symptoms, no diagnosis) —
architecturally a sibling of the diagnosis pipeline, not a step inside it. It gets its
own agent class, its own FastAPI route, its own frontend page.

```
frontend (new page: advisor.tsx)  →  POST /api/advisor  →  Next.js API route
                                                                  │
                                                   (if AGENT_URL set)
                                                                  ↓
                                        Python backend  →  POST /advise
                                                                  │
                                                       PlantingAdvisorAgent
                                                        ├── OpenMeteo (16-day forecast)
                                                        └── Gemini (+ crop_varieties.json)
```

## 3. Backend changes

| File | Action | Notes |
|---|---|---|
| `agents/schemas/planting_schema.py` | new | `PlantingAdvice` Pydantic model |
| `agents/prompts/planting_advisor_prompt.py` | new | system prompt, mirrors `weather_alert_prompt.py` |
| `agents/data/crop_varieties.json` | new | curated variety reference data, keyed by crop |
| `agents/agents/planting_advisor.py` | new | `PlantingAdvisorAgent.advise()`, mirrors `weather_alert.py` |
| `agents/tools/openmeteo_weather.py` | modify | add `fetch_forecast(lat, lon, days=16)` or extend `forecast_days` param |
| `agents/config/constants.py` | modify | expand `REGION_COORDINATES` from 13 → all 25 districts (currently silently falls back to island-centre coords for 12 districts — same gap affects the existing weather agent, cheap to fix while touching this file) |
| `agents/server.py` | modify | add `AdviseRequest` model + `POST /advise` route, rate-limited like `/run` |
| `agents/tests/test_planting_advisor.py` | new | mirrors `test_weather_alert.py` |

### 3a. Schema (`planting_schema.py`)

```python
class VarietyRecommendation(BaseModel):
    variety_name: str
    reason: str
    days_to_maturity: int

class PlantingAdvice(BaseModel):
    crop_type: str
    region: str
    recommended_variety: VarietyRecommendation
    sowing_window_label: str      # "22 Aug – 5 Sep 2026"
    sowing_window_start: str      # ISO date
    sowing_window_end: str        # ISO date
    season: str                   # "Yala" | "Maha"
    risk_notes: list[str]
    confidence: str                # "high" | "medium" | "low"
    advisory_summary: str
    error: Optional[str] = None
```

### 3b. Agent (`planting_advisor.py`)

Same structure as `WeatherAlertAgent.analyse()`:
1. Resolve district → lat/lon via `REGION_COORDINATES` (fallback to island centre + warn).
2. Fetch 16-day forecast via `fetch_forecast()` (retry via `with_retry`, same as weather agent).
3. Load `crop_varieties.json`, filter to the requested `crop_type`.
4. Build a Gemini prompt: crop type, region, season context, forecast summary, and the
   filtered variety list — instruct Gemini to pick the best-fit variety from the given
   list only (not invent one) and propose a sowing window.
5. Call Gemini with `response_mime_type="application/json"`, parse into `PlantingAdvice`,
   validate `recommended_variety.variety_name` is actually one of the options given
   (guard against hallucination — fall back to the first list entry if not).
6. Never raise — same fallback-on-every-step discipline as `weather_alert.py`.

### 3c. Server route

```python
class AdviseRequest(BaseModel):
    crop_type: str = Field(..., min_length=1)
    region: str = Field(..., min_length=1)

@app.post("/advise")
@limiter.limit("5/minute")
def advise(request: Request, req: AdviseRequest):
    if not daily_quota.check_and_increment():
        raise HTTPException(status_code=429, detail="Daily quota reached.")
    result = _planting_agent.advise(crop_type=req.crop_type, region=req.region)
    return result.model_dump()
```

## 4. Frontend changes

| File | Action | Notes |
|---|---|---|
| `frontend/src/lib/types.ts` | modify | add `PlantingAdvice` interface mirroring the Pydantic schema |
| `frontend/src/lib/api.ts` | modify | add `submitAdvisorQuery()`, POSTs to `/api/advisor` |
| `frontend/src/pages/api/advisor.ts` | new | mirrors `api/agents.ts`: proxy to `${AGENT_URL}/advise` if set, else mock, else 503 |
| `frontend/src/pages/advisor.tsx` | new | form: crop `<select>` (reuse `CROP_TYPES`) + `DistrictPicker` (reuse existing component) — **no image upload, no symptoms field** |
| `frontend/src/pages/advisor-results.tsx` | new | variety card, sowing-window calendar strip, risk notes, confidence badge |
| `frontend/src/pages/index.tsx` | modify | add a second CTA/nav entry: "Plan Your Planting" alongside the existing "Diagnose" CTA |

Mock mode: add `CROP_ADVISOR_MOCK_DATA` to `api/advisor.ts` (or a shared mock file),
one entry per crop in `CROP_TYPES`, same pattern as the existing `CROP_MOCK_DATA` in
`api/agents.ts` — reuse that file's `is_mock: true` / `[DEMO]` convention for consistency.

## 5. Testing

- `agents/tests/test_planting_advisor.py`: mock OpenMeteo + Gemini, assert schema
  validation, assert fallback behavior on API failure, assert variety-hallucination guard
  (Gemini returns a variety not in the given list → falls back correctly).
- Add `/advise` smoke test to `agents/tests/test_server.py` (mirrors existing `/run` test).
- Manual smoke test (same shape as the existing `/run` smoke test in `CLAUDE.md`):

```powershell
$body = @{ crop_type = "rice"; region = "Anuradhapura" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8000/advise" -Method POST `
  -ContentType "application/json" -Body $body -TimeoutSec 60 |
  Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

## 6. Suggested build order

- [ ] `crop_varieties.json` — curate 2–3 real varieties per crop (10 crops → ~20–30 entries)
- [ ] `planting_schema.py`
- [ ] `planting_advisor_prompt.py`
- [ ] `fetch_forecast()` extension in `openmeteo_weather.py`
- [ ] `planting_advisor.py` agent
- [ ] `REGION_COORDINATES` — fill in the remaining 12 districts
- [ ] `POST /advise` route in `server.py` + `test_planting_advisor.py` + smoke test
- [ ] `types.ts` + `api.ts` + `api/advisor.ts` (with mock data)
- [ ] `advisor.tsx` + `advisor-results.tsx` pages
- [ ] Nav link from `index.tsx`
- [ ] README: Tech Stack row + Scope Delivered entry documenting the historical-yield
      substitution honestly

## 7. Why this is a good score-per-effort bet

- Reuses every existing pattern (agent class shape, retry/fallback discipline, prompt
  style, mock-mode convention, rate limiting) — low integration risk, nothing existing
  is touched except two small additive changes (`constants.py`, `openmeteo_weather.py`).
- Closes a proposal gap by name → direct "Functionality" score credit.
- A 4th independently-working agent, backed by real forecast data + a grounded
  reference dataset (not just LLM freeform text) → "Technical Depth" credit.
- Fully demoable in the video without needing any infrastructure beyond what's already
  deployed (OpenMeteo + Gemini, both already in use).
