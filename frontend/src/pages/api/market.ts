import type { NextApiRequest, NextApiResponse } from "next";
import type { MarketPriceResult, MarketQuery } from "@/lib/types";

// ---------------------------------------------------------------------------
// Per-crop demo data used only in MOCK_MODE. Mirrors the pattern in
// pages/api/agents.ts and pages/api/advisor.ts. Prices match
// agents/data/market_prices.json so mock and real stay consistent.
// ---------------------------------------------------------------------------
type CropPriceData = { unit: string; avgPriceLkr: number; volatilityPct: number };

const CROP_PRICE_DATA: Record<string, CropPriceData> = {
  rice: { unit: "per kg (paddy)", avgPriceLkr: 100, volatilityPct: 0.12 },
  corn: { unit: "per kg", avgPriceLkr: 100, volatilityPct: 0.15 },
  tea: { unit: "per kg (green leaf)", avgPriceLkr: 100, volatilityPct: 0.18 },
  coconut: { unit: "per nut", avgPriceLkr: 80, volatilityPct: 0.2 },
  banana: { unit: "per kg", avgPriceLkr: 180, volatilityPct: 0.2 },
  cassava: { unit: "per kg", avgPriceLkr: 100, volatilityPct: 0.15 },
  pepper: { unit: "per kg (dried)", avgPriceLkr: 2500, volatilityPct: 0.15 },
  chilli: { unit: "per kg (green)", avgPriceLkr: 200, volatilityPct: 0.3 },
  tomato: { unit: "per kg", avgPriceLkr: 150, volatilityPct: 0.35 },
  potato: { unit: "per kg", avgPriceLkr: 220, volatilityPct: 0.18 },
};

const TREND_THRESHOLD_PCT = 5.0;

// ---------------------------------------------------------------------------
// Deterministic per-(crop, day) offset -- same idea as the backend's
// hashlib.sha256 approach: today's price is stable within a day but moves
// day to day, without needing a live fetch. Doesn't need to match the
// backend's exact hash, just the same "stable-per-day" property.
// ---------------------------------------------------------------------------
function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function todaysOffsetPct(cropType: string, isoDate: string): number {
  const h = hashString(`${cropType.toLowerCase()}:${isoDate}`);
  return ((Math.abs(h) % 2001) - 1000) / 1000; // in [-1.0, 1.0]
}

function advisoryFor(trend: string, changePct: number, cropType: string): string {
  if (trend === "up") {
    return `[DEMO] Prices are ${Math.abs(changePct).toFixed(0)}% above the recent average for ${cropType} — a good time to sell if you have stock ready.`;
  }
  if (trend === "down") {
    return `[DEMO] Prices are ${Math.abs(changePct).toFixed(0)}% below the recent average for ${cropType} — consider holding if you can, or factor this into your asking price.`;
  }
  return `[DEMO] Prices are close to the recent average for ${cropType} — a fair baseline to start negotiating from.`;
}

const FALLBACK_CROP_KEY = "rice";

function buildMockPrice(query: MarketQuery): MarketPriceResult {
  const key = query.crop_type.toLowerCase();
  const data = CROP_PRICE_DATA[key] ?? CROP_PRICE_DATA[FALLBACK_CROP_KEY];
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);

  const offset = todaysOffsetPct(query.crop_type, isoDate);
  const todaysPrice = Math.round(data.avgPriceLkr * (1 + offset * data.volatilityPct) * 100) / 100;
  const changePct = Math.round(((todaysPrice - data.avgPriceLkr) / data.avgPriceLkr) * 1000) / 10;

  const trend = changePct >= TREND_THRESHOLD_PCT ? "up" : changePct <= -TREND_THRESHOLD_PCT ? "down" : "stable";

  return {
    is_mock: true,
    crop_type: query.crop_type,
    unit: data.unit,
    todays_price_lkr: todaysPrice,
    avg_price_30d_lkr: data.avgPriceLkr,
    price_change_pct: changePct,
    trend,
    advisory: advisoryFor(trend, changePct, query.crop_type),
    last_updated: isoDate,
  };
}

// ---------------------------------------------------------------------------
// Sliding-window IP rate limiter — same shape as pages/api/agents.ts.
// ---------------------------------------------------------------------------
const ipHits = new Map<string, { count: number; windowStart: number }>();
const LIMIT = 20;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();
  const rec = ipHits.get(ip);
  if (!rec || now - rec.windowStart > WINDOW_MS) {
    ipHits.set(ip, { count: 1, windowStart: now });
    return { limited: false, retryAfterSec: 0 };
  }
  rec.count++;
  const retryAfterSec = Math.ceil((rec.windowStart + WINDOW_MS - now) / 1000);
  return { limited: rec.count > LIMIT, retryAfterSec };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MarketPriceResult | { error: string; retryAfterSec?: number }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ??
    req.socket.remoteAddress ??
    "unknown";
  const { limited, retryAfterSec } = isRateLimited(ip);
  if (limited) {
    res.setHeader("Retry-After", retryAfterSec.toString());
    return res.status(429).json({
      error: "Too many requests. Please wait a moment and try again.",
      retryAfterSec,
    });
  }

  const query = req.body as MarketQuery;
  const { crop_type } = query;

  if (!crop_type) {
    return res.status(400).json({ error: "Missing required field: crop_type" });
  }

  // If AGENT_URL is configured, proxy to the live Python backend.
  const agentUrl = process.env.AGENT_URL?.replace(/\/+$/, "");
  if (agentUrl) {
    try {
      const upstream = await fetch(`${agentUrl}/market-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        signal: AbortSignal.timeout(30_000),
      });

      if (!upstream.ok) {
        const text = await upstream.text().catch(() => "");
        return res.status(502).json({ error: `Backend error ${upstream.status}: ${text}` });
      }

      const result = await upstream.json();
      return res.status(200).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(502).json({ error: `Failed to reach agent backend: ${message}` });
    }
  }

  // Explicit demo/development mock — only active when MOCK_MODE=true.
  if (process.env.MOCK_MODE === "true") {
    return res.status(200).json(buildMockPrice(query));
  }

  // Neither a live backend nor explicit mock mode is configured.
  return res.status(503).json({
    error:
      "Market price service is not configured. " +
      "Set AGENT_URL to point to the Python backend, " +
      "or set MOCK_MODE=true to enable the local demo mode.",
  });
}
