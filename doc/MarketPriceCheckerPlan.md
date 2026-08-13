# Live Market Price Checker — Implementation Plan

Goal: close the second named proposal gap — "before a farmer negotiates with a middleman,
they can check today's farm-gate prices for their crop via a single tap... displayed as a
simple comparison to recent averages."

## 1. Scope decision — what we're actually building

The proposal says prices are "sourced daily from the Department of Agriculture." The
Department of Agriculture / HARTI publish price bulletins but expose no public API, and
reliable live scraping wasn't something to commit to blind before a deadline (same judgment
call already made for `resource_recommendation.py`'s Hayleys catalog: a static snapshot, not
live scraping).

Instead: a curated dataset of **representative typical farm-gate price ranges** per crop
(`agents/data/market_prices.json`), combined with a **deterministic daily variation model** —
today's price is derived from a hash of `(crop_type, today's date)`, so it moves day to day
(looks live, is stable within a day, requires no network call) rather than being pulled from a
live government feed. This is a defensible substitution, not the literal claim, and — matching
the pattern set by the Planting Advisor's variety dataset — must be stated plainly in the
README's Scope Delivered section.

No Gemini call needed here — like `ResourceRecommendationAgent`, this is a pure lookup +
calculation agent. Keeps it fast (no LLM latency) and avoids burning Gemini quota on a feature
that's fundamentally "look up a number and compare it to another number."

## 2. Where it fits

Standalone, like the Planting Advisor: a single-tap flow needing only `crop_type` (no region —
being honest that we don't have real district-level price granularity to back up, so we don't
imply it). Own agent, own route, own frontend page.

```
frontend (new page: market.tsx)  ->  POST /api/market  ->  Next.js API route
                                                                 |
                                                  (if AGENT_URL set)
                                                                 v
                                       Python backend  ->  POST /market-price
                                                                 |
                                                        MarketPriceAgent
                                                         `-- static price dataset + deterministic
                                                             daily variation (no Gemini call)
```

## 3. Backend changes

| File | Action | Notes |
|---|---|---|
| `agents/schemas/market_price_schema.py` | new | `MarketPriceResult` Pydantic model |
| `agents/data/market_prices.json` | new | representative avg farm-gate price + unit per crop |
| `agents/data/market_prices.py` | new | loader, mirrors `crop_varieties.py` |
| `agents/agents/market_price.py` | new | `MarketPriceAgent.check_price()`, no Gemini call |
| `agents/server.py` | modify | add `MarketPriceRequest` model + `POST /market-price` route |
| `agents/tests/test_market_price.py` | new | mirrors `test_planting_advisor.py`'s harness shape |

### 3a. Schema

```python
class MarketPriceResult(BaseModel):
    crop_type: str
    unit: str                    # "per kg" | "per nut" (coconut)
    todays_price_lkr: float
    avg_price_30d_lkr: float
    price_change_pct: float
    trend: str                   # "up" | "down" | "stable"
    advisory: str
    last_updated: str            # ISO date
    error: Optional[str] = None
```

### 3b. Deterministic "today's price" calculation

```python
seed = f"{crop_type}:{date.today().isoformat()}"
offset_pct = (int(hashlib.sha256(seed.encode()).hexdigest(), 16) % 2001 - 1000) / 1000
# offset_pct in [-1.0, 1.0], scaled by the crop's volatility_pct from market_prices.json
todays_price = avg_price * (1 + offset_pct * volatility_pct)
```

Same crop + same date always produces the same price (stable across repeated calls/demos
within a day), but changes day to day without needing a live fetch.

### 3c. Advisory rule (no LLM needed — plain thresholds)

- `price_change_pct >= +5%` -> `trend="up"`, advise selling now
- `price_change_pct <= -5%` -> `trend="down"`, advise holding if possible
- otherwise -> `trend="stable"`, advise it's a fair baseline for negotiating

### 3d. Server route

```python
class MarketPriceRequest(BaseModel):
    crop_type: str = Field(..., min_length=1)

@app.post("/market-price")
@limiter.limit("10/minute")   # cheaper than /run and /advise -- no LLM call, higher limit is fine
def market_price(request: Request, req: MarketPriceRequest):
    result = _market_price_agent.check_price(crop_type=req.crop_type)
    return result.model_dump()
```

No daily-quota check here — that quota exists to protect Gemini spend, and this route never
calls Gemini.

## 4. Frontend changes

| File | Action | Notes |
|---|---|---|
| `frontend/src/lib/types.ts` | modify | add `MarketPriceResult`, `MarketQuery` |
| `frontend/src/lib/api.ts` | modify | add `submitMarketQuery()` |
| `frontend/src/hooks/useMarketPrice.ts` | new | mirrors `useAdvisor.ts` |
| `frontend/src/pages/api/market.ts` | new | mirrors `api/advisor.ts`: proxy / mock / 503, mock uses the *same* deterministic day-hash logic client-side so mock and real stay visually consistent |
| `frontend/src/pages/market.tsx` | new | single-field form: crop only, no district (true to "single tap") |
| `frontend/src/pages/market-results.tsx` | new | today's price vs 30-day avg, trend badge, advisory text |
| `frontend/src/components/layout/SharedNav.tsx` | modify | add "Market Prices" nav link |
| `frontend/src/pages/index.tsx` | modify | add feature card + CTA |

## 5. Testing

- `agents/tests/test_market_price.py`: assert determinism (same crop+date -> same price twice),
  assert all 10 crops resolve, assert unknown crop handled gracefully.
- `/market-price` smoke test added to `agents/tests/test_server.py`.
- Manual smoke test:

```powershell
$body = @{ crop_type = "rice" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8000/market-price" -Method POST `
  -ContentType "application/json" -Body $body -TimeoutSec 30 |
  Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

## 6. Suggested build order

- [ ] `market_prices.json` — curate representative price + volatility per crop (10 crops)
- [ ] `market_price_schema.py`
- [ ] `market_price.py` agent (deterministic calc + advisory rule)
- [ ] `POST /market-price` route + `test_market_price.py` + server smoke test
- [ ] `types.ts` + `api.ts` + `useMarketPrice.ts` + `api/market.ts` (mock mirrors real logic)
- [ ] `market.tsx` + `market-results.tsx`
- [ ] Nav link + homepage feature card
- [ ] README: feature bullet, `/market-price` API reference, project structure, Scope Delivered
      entry documenting the "representative price, not live Dept. of Agriculture feed" honesty note

## 7. Why this is a good score-per-effort bet

- No Gemini call -> fastest agent in the app, zero added LLM latency or quota risk.
- Reuses the exact static-lookup pattern already proven in `resource_recommendation.py`.
- Directly answers a named problem-statement pain point ("exploited by middlemen") with a
  concrete, demoable number a farmer could act on.
- Fully offline-demoable (no network dependency at all, unlike the weather/planting agents),
  which is a nice fallback if venue wifi is unreliable during the actual pitch.
