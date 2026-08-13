import type { NextApiRequest, NextApiResponse } from "next";
import type { AdvisorQuery, PlantingAdvice } from "@/lib/types";

// ---------------------------------------------------------------------------
// Per-crop demo data used only in MOCK_MODE. Mirrors the pattern in
// pages/api/agents.ts (CROP_MOCK_DATA) so the two mock layers stay consistent.
// Variety names match agents/data/crop_varieties.json so the demo never shows
// a variety the real backend couldn't also recommend.
// ---------------------------------------------------------------------------
type CropAdvisorMockData = {
  variety_name: string;
  reason: string;
  days_to_maturity: number;
  risk_notes: string[];
  advisory_summary: string;
};

const CROP_ADVISOR_MOCK_DATA: Record<string, CropAdvisorMockData> = {
  rice: {
    variety_name: "Bg 300",
    reason: "Short-duration and drought-tolerant, well suited to variable dry-zone rainfall.",
    days_to_maturity: 105,
    risk_notes: ["A dry spell is forecast partway through the window — irrigate at sowing if possible."],
    advisory_summary: "Bg 300 balances a short growth cycle with drought tolerance, reducing exposure to the next dry stretch.",
  },
  corn: {
    variety_name: "Sampath",
    reason: "Open-pollinated and drought-tolerant, a reliable choice when rainfall is uneven.",
    days_to_maturity: 105,
    risk_notes: ["Ensure drainage — a wetter-than-average week is forecast mid-window."],
    advisory_summary: "Sampath's drought tolerance gives useful buffer given the mixed forecast ahead.",
  },
  tea: {
    variety_name: "TRI 3055",
    reason: "Drought-tolerant cultivar recommended for intermediate and uva-zone conditions.",
    days_to_maturity: 1095,
    risk_notes: ["New plantings are vulnerable to moisture stress in the first month — mulch well."],
    advisory_summary: "TRI 3055 is the safer pick where dry spells between showers are common.",
  },
  coconut: {
    variety_name: "CRIC 60",
    reason: "Hybrid with early bearing and high yield, well suited to consistent rainfall zones.",
    days_to_maturity: 1460,
    risk_notes: [],
    advisory_summary: "CRIC 60 offers earlier returns than traditional talls given the current rainfall outlook.",
  },
  banana: {
    variety_name: "Anamalu",
    reason: "Large-fruited and relatively drought-tolerant compared to other local varieties.",
    days_to_maturity: 330,
    risk_notes: [],
    advisory_summary: "Anamalu's drought tolerance makes it a safer bet for the coming weeks.",
  },
  cassava: {
    variety_name: "Kirikawadi",
    reason: "Traditional, drought-tolerant variety well matched to variable rainfall.",
    days_to_maturity: 300,
    risk_notes: [],
    advisory_summary: "Kirikawadi's drought tolerance suits the forecast conditions in this district.",
  },
  pepper: {
    variety_name: "Panniyur 1",
    reason: "High-yielding hybrid widely grown across Sri Lankan pepper-growing districts.",
    days_to_maturity: 1095,
    risk_notes: ["Ensure support structures are in place before the wetter part of the window."],
    advisory_summary: "Panniyur 1 is the standard high-yield choice for this district's conditions.",
  },
  chilli: {
    variety_name: "KA-2",
    reason: "Dry-zone, drought-tolerant variety suited to districts with less reliable rainfall.",
    days_to_maturity: 100,
    risk_notes: [],
    advisory_summary: "KA-2's drought tolerance reduces risk if the forecast dry spell extends.",
  },
  tomato: {
    variety_name: "T 245",
    reason: "Heat-tolerant and suited to dry-zone growing conditions.",
    days_to_maturity: 75,
    risk_notes: ["Watch for blossom drop if temperatures spike during flowering."],
    advisory_summary: "T 245's heat tolerance fits the warmer stretch forecast for this window.",
  },
  potato: {
    variety_name: "Granola",
    reason: "The most widely grown up-country variety, with a reliable track record locally.",
    days_to_maturity: 90,
    risk_notes: [],
    advisory_summary: "Granola is the dependable default for up-country conditions this season.",
  },
};

const FALLBACK_CROP_KEY = "rice";

// ---------------------------------------------------------------------------
// Season + sowing window helpers (mirror the backend's season logic so the
// mock never contradicts the real agent's behaviour).
// ---------------------------------------------------------------------------
function seasonForDate(d: Date): "Maha" | "Yala" {
  const month = d.getMonth() + 1; // 1-12
  return month >= 10 || month <= 2 ? "Maha" : "Yala";
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtShort(d: Date): string {
  return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]}`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildSowingWindow(): { label: string; start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() + 5);
  const end = new Date(today);
  end.setDate(end.getDate() + 19);
  return { label: `${fmtShort(start)} - ${fmtShort(end)}`, start: isoDate(start), end: isoDate(end) };
}

// ---------------------------------------------------------------------------
// Sliding-window IP rate limiter — same shape as pages/api/agents.ts.
// ---------------------------------------------------------------------------
const ipHits = new Map<string, { count: number; windowStart: number }>();
const LIMIT = 10;
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
// Mock result builder — only called when MOCK_MODE=true.
// ---------------------------------------------------------------------------
function buildMockAdvice(query: AdvisorQuery): PlantingAdvice {
  const data =
    CROP_ADVISOR_MOCK_DATA[query.crop_type.toLowerCase()] ?? CROP_ADVISOR_MOCK_DATA[FALLBACK_CROP_KEY];
  const window = buildSowingWindow();

  return {
    is_mock: true,
    crop_type: query.crop_type,
    region: query.region,
    recommended_variety: {
      variety_name: data.variety_name,
      reason: data.reason,
      days_to_maturity: data.days_to_maturity,
    },
    sowing_window_label: window.label,
    sowing_window_start: window.start,
    sowing_window_end: window.end,
    season: seasonForDate(new Date()),
    risk_notes: data.risk_notes,
    confidence: "medium",
    advisory_summary: `[DEMO] ${data.advisory_summary} Set AGENT_URL to use the real AI backend.`,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlantingAdvice | { error: string; retryAfterSec?: number }>
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

  const query = req.body as AdvisorQuery;
  const { crop_type, region } = query;

  if (!crop_type || !region) {
    return res.status(400).json({
      error: "Missing required fields: crop_type, region",
    });
  }

  // If AGENT_URL is configured, proxy to the live Python backend.
  const agentUrl = process.env.AGENT_URL?.replace(/\/+$/, "");
  if (agentUrl) {
    try {
      const upstream = await fetch(`${agentUrl}/advise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        signal: AbortSignal.timeout(60_000),
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
    return res.status(200).json(buildMockAdvice(query));
  }

  // Neither a live backend nor explicit mock mode is configured.
  return res.status(503).json({
    error:
      "Planting advisor service is not configured. " +
      "Set AGENT_URL to point to the Python backend, " +
      "or set MOCK_MODE=true to enable the local demo mode.",
  });
}
