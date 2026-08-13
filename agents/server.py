"""FastAPI HTTP server wrapping OrchestratorAgent.

Local dev:
    cd D:\\GoviHitha
    uvicorn agents.server:app --reload --port 8000

Cloud Run:
    Listens on $PORT (default 8080). Container built from repo-root Dockerfile.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from agents.agents.market_price import MarketPriceAgent
from agents.agents.orchestrator import OrchestratorAgent
from agents.agents.planting_advisor import PlantingAdvisorAgent
from agents.rate_limit import daily_quota
from agents.utils.logger import get_logger

logger = get_logger(__name__)

RATE_LIMIT_DISABLED = os.environ.get("RATE_LIMIT_DISABLED", "false").lower() == "true"
limiter = Limiter(key_func=get_remote_address, enabled=not RATE_LIMIT_DISABLED)

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class RunRequest(BaseModel):
    crop_type: str = Field(..., min_length=1)
    symptoms: str = Field(..., min_length=1)
    image_base64: str = Field(..., min_length=1)
    region: str = Field(..., min_length=1)


class AdviseRequest(BaseModel):
    crop_type: str = Field(..., min_length=1)
    region: str = Field(..., min_length=1)


class MarketPriceRequest(BaseModel):
    crop_type: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

_orchestrator: OrchestratorAgent | None = None
_planting_agent: PlantingAdvisorAgent | None = None
_market_price_agent: MarketPriceAgent | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _orchestrator, _planting_agent, _market_price_agent
    logger.info("Starting GoviHitha agent server")
    _orchestrator = OrchestratorAgent()
    _planting_agent = PlantingAdvisorAgent()
    _market_price_agent = MarketPriceAgent()
    yield
    logger.info("Shutting down GoviHitha agent server")


app = FastAPI(
    title="GoviHitha Agent API",
    description="AI crop advisory backend for Sri Lankan farmers.",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allow requests from the Next.js frontend (any origin in dev; lock down in prod)
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "govihitha-agents"}


@app.post("/run")
@limiter.limit("5/minute")
def run_agent(request: Request, req: RunRequest):
    """Run the full orchestration pipeline and return an OrchestrationResult."""
    if _orchestrator is None:
        raise HTTPException(status_code=503, detail="Orchestrator not initialised")

    if not daily_quota.check_and_increment():
        raise HTTPException(
            status_code=429,
            detail="Daily quota reached. The service resets at midnight.",
        )

    logger.info(
        "POST /run crop=%s region=%s symptoms_len=%d",
        req.crop_type, req.region, len(req.symptoms),
    )

    result = _orchestrator.run(
        crop_type=req.crop_type,
        symptoms=req.symptoms,
        image_source=req.image_base64,
        region=req.region,
    )
    return result.model_dump()


@app.post("/advise")
@limiter.limit("5/minute")
def advise(request: Request, req: AdviseRequest):
    """Run the PlantingAdvisorAgent and return a PlantingAdvice."""
    if _planting_agent is None:
        raise HTTPException(status_code=503, detail="Planting advisor not initialised")

    if not daily_quota.check_and_increment():
        raise HTTPException(
            status_code=429,
            detail="Daily quota reached. The service resets at midnight.",
        )

    logger.info("POST /advise crop=%s region=%s", req.crop_type, req.region)

    result = _planting_agent.advise(crop_type=req.crop_type, region=req.region)
    return result.model_dump()


@app.post("/market-price")
@limiter.limit("10/minute")
def market_price(request: Request, req: MarketPriceRequest):
    """Return today's farm-gate price vs. the recent average for a crop.

    No daily-quota check -- this route never calls Gemini, so it doesn't draw
    against the LLM spend quota.
    """
    if _market_price_agent is None:
        raise HTTPException(status_code=503, detail="Market price agent not initialised")

    logger.info("POST /market-price crop=%s", req.crop_type)

    result = _market_price_agent.check_price(crop_type=req.crop_type)
    return result.model_dump()


# ---------------------------------------------------------------------------
# Global error handler — never expose raw tracebacks
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error. Check server logs."},
    )
