import type { NextApiRequest, NextApiResponse } from "next";
import type { AgentQuery, OrchestrationResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Per-crop demo data used only in MOCK_MODE.
// Each entry provides the minimum needed to build a self-consistent, crop-correct
// mock response. Kept here so a developer can see at a glance what changes when
// the real backend is added.
// ---------------------------------------------------------------------------
type CropMockData = {
  disease_name: string;
  description: string;
  treatment_steps: string[];
  timeline: string;
  prevention: string;
  fungicide_name: string;
  fungicide_cost: string;
  fungicide_why: string;
  active_ingredient: string;
  hayleys_product_url: string;
  alert_context: string;
  alert_action: string;
};

const CROP_MOCK_DATA: Record<string, CropMockData> = {
  rice: {
    disease_name: "Rice Leaf Blast",
    description: "Fungal infection by Magnaporthe oryzae, common in humid Sri Lankan paddy fields. Spreads rapidly in warm, wet conditions.",
    treatment_steps: [
      "Apply Folicur Tebuconazole at label rate across all affected areas.",
      "Improve field drainage to reduce standing water.",
      "Remove and destroy infected plant material immediately.",
    ],
    timeline: "7–10 days with consistent treatment",
    prevention: "Use blast-resistant varieties, avoid excess nitrogen, rotate crops each season.",
    fungicide_name: "Folicur Tebuconazole",
    fungicide_cost: "Contact dealer for pricing",
    fungicide_why: "Tebuconazole is explicitly listed for Rice Blast in paddy — systemic triazole with protective and curative action against Magnaporthe oryzae.",
    active_ingredient: "Tebuconazole 250g/L EW",
    hayleys_product_url: "https://www.hayleysagriculture.com/folicur-tebuconazole/",
    alert_context: "Heavy rain in 48 h will accelerate fungal spread in waterlogged paddy fields.",
    alert_action: "Improve field drainage immediately and apply fungicide before rain arrives.",
  },
  tomato: {
    disease_name: "Tomato Early Blight",
    description: "Fungal infection by Alternaria solani; concentric brown spots on older leaves, spreading inward. Common in warm, humid conditions.",
    treatment_steps: [
      "Remove and destroy all infected leaves immediately to reduce fungal load.",
      "Apply Hayleys Mancozeb at 2 g/L of water every 7 days.",
      "Improve plant spacing to allow air circulation and reduce leaf wetness.",
    ],
    timeline: "10–14 days with consistent treatment",
    prevention: "Use disease-free seedlings, practice crop rotation, mulch to prevent soil splash.",
    fungicide_name: "Hayleys Mancozeb",
    fungicide_cost: "Contact dealer for pricing",
    fungicide_why: "Mancozeb is explicitly listed for Tomato Early Blight — broad-spectrum contact protectant fungicide against Alternaria solani.",
    active_ingredient: "Mancozeb 80% WP",
    hayleys_product_url: "https://www.hayleysagriculture.com/hayleys-mancozeb/",
    alert_context: "High humidity will favour further fungal spread on tomato foliage.",
    alert_action: "Apply fungicide before next rainfall and avoid overhead irrigation.",
  },
  potato: {
    disease_name: "Potato Late Blight",
    description: "Caused by Phytophthora infestans; water-soaked lesions on leaves that turn brown rapidly, especially during cool, wet periods.",
    treatment_steps: [
      "Remove and bag all infected plant material — do not compost.",
      "Apply Nando Fluazinam at label rate preventatively and after rain.",
      "Hill up soil around stems to protect tubers from spore wash-down.",
    ],
    timeline: "Spread can be halted within 7–14 days with prompt treatment",
    prevention: "Use certified disease-free seed tubers, ensure good drainage, avoid dense planting.",
    fungicide_name: "Nando Fluazinam",
    fungicide_cost: "Contact dealer for pricing",
    fungicide_why: "Fluazinam is explicitly formulated for Potato Blight and Tuber Blight — highly effective against Phytophthora infestans.",
    active_ingredient: "Fluazinam 500g/L SC",
    hayleys_product_url: "https://www.hayleysagriculture.com/nando-fluazinam/",
    alert_context: "Cool, wet weather significantly increases late blight risk.",
    alert_action: "Apply systemic fungicide immediately and repeat every 5 days during wet periods.",
  },
  chilli: {
    disease_name: "Chilli Anthracnose",
    description: "Caused by Colletotrichum spp.; sunken, dark lesions on ripening fruit, often with orange spore masses in humid conditions.",
    treatment_steps: [
      "Remove and destroy all infected fruit and plant debris.",
      "Apply Nativo 75 WG at label rate every 10 days.",
      "Avoid overhead irrigation; water at the base of plants.",
    ],
    timeline: "2–3 weeks with consistent management",
    prevention: "Use resistant varieties, avoid wounding fruit during harvest, maintain field hygiene.",
    fungicide_name: "Nativo 75 WG",
    fungicide_cost: "Contact dealer for pricing",
    fungicide_why: "Nativo (Trifloxystrobin + Tebuconazole) is explicitly listed for Capsicum Anthracnose — combines systemic and contact action against Colletotrichum spp.",
    active_ingredient: "Tebuconazole 500g/kg + Trifloxystrobin 250g/kg WG",
    hayleys_product_url: "https://www.hayleysagriculture.com/nativo-75-wg/",
    alert_context: "High humidity accelerates anthracnose spread on ripening fruit.",
    alert_action: "Harvest any ripe, uninfected fruit immediately before rain arrives.",
  },
  coconut: {
    disease_name: "Coconut Mite Infestation",
    description: "Eriophyid mite (Aceria guerreronis) damages developing nuts, causing scarring and husk splitting. Thrives in dry, hot conditions.",
    treatment_steps: [
      "Apply wettable sulphur (3 g/L) to the perianth region of young nuts.",
      "Remove and destroy severely affected nuts.",
      "Repeat application every 30 days during dry season.",
    ],
    timeline: "Improvement in 4–6 weeks with consistent treatment",
    prevention: "Maintain tree vigour with balanced fertilisation; monitor young nuts monthly.",
    fungicide_name: "Wettable Sulphur 80% WP",
    fungicide_cost: "Contact local agri-supply shop",
    fungicide_why: "Wettable sulphur is an effective acaricide for coconut eriophyid mites at the perianth region.",
    active_ingredient: "Sulphur 80% WP",
    hayleys_product_url: "",
    alert_context: "Dry, hot weather increases mite activity on developing nuts.",
    alert_action: "Schedule sulphur application before the next dry spell.",
  },
  tea: {
    disease_name: "Tea Blister Blight",
    description: "Caused by Exobasidium vexans; pale, blister-like lesions on young leaves and shoots. Most severe in cool, misty highland conditions.",
    treatment_steps: [
      "Apply Hayleys Hexaconazole at label rate at first sign of blisters.",
      "Adjust shade to reduce prolonged leaf wetness.",
      "Time plucking rounds to remove infected shoots promptly.",
    ],
    timeline: "Outbreak controlled within 2–3 weeks with regular spraying",
    prevention: "Use resistant cultivars, avoid over-shading, maintain good drainage in tea fields.",
    fungicide_name: "Hayleys Hexaconazole",
    fungicide_cost: "Contact dealer for pricing",
    fungicide_why: "Hexaconazole is explicitly listed for Tea Blister Blight (Exobasidium vexans) — systemic triazole with curative action.",
    active_ingredient: "Hexaconazole (triazole)",
    hayleys_product_url: "https://www.hayleysagriculture.com/hayleys-hexaconazole/",
    alert_context: "Misty, cool conditions in highland areas increase blister blight severity.",
    alert_action: "Apply fungicide before mist periods and after any rainfall.",
  },
  banana: {
    disease_name: "Black Sigatoka",
    description: "Caused by Mycosphaerella fijiensis; dark streaks on leaves expanding into brown necrotic patches, reducing photosynthesis and yield.",
    treatment_steps: [
      "Remove and destroy severely infected leaves immediately.",
      "Apply Folicur Tebuconazole at label rate every 3 weeks during wet season.",
      "Ensure adequate spacing and de-leaf sucker plants to improve airflow.",
    ],
    timeline: "4–6 weeks with consistent fungicide programme",
    prevention: "Use Sigatoka-resistant varieties; remove old leaves regularly; maintain field drainage.",
    fungicide_name: "Folicur Tebuconazole",
    fungicide_cost: "Contact dealer for pricing",
    fungicide_why: "Tebuconazole is explicitly listed for Banana Sigatoka (including Black Sigatoka, Mycosphaerella fijiensis) — systemic triazole with proven efficacy.",
    active_ingredient: "Tebuconazole 250g/L EW",
    hayleys_product_url: "https://www.hayleysagriculture.com/folicur-tebuconazole/",
    alert_context: "High rainfall and humidity significantly accelerate Sigatoka spread.",
    alert_action: "Apply systemic fungicide before the rain event and remove all dead leaves.",
  },
  pepper: {
    disease_name: "Pepper Phytophthora Blight",
    description: "Caused by Phytophthora capsici; rapid wilting, stem base rot, and defoliation. Most destructive in waterlogged conditions.",
    treatment_steps: [
      "Improve drainage immediately — do not allow water to pool near stems.",
      "Apply a Phytophthora-specific oomycide (e.g. Metalaxyl-M) as a drench around the root zone.",
      "Remove and destroy infected plants to prevent further spread.",
    ],
    timeline: "Spread stopped within 1–2 weeks if drainage is corrected promptly",
    prevention: "Plant on raised beds, use disease-free transplants, avoid overhead irrigation.",
    fungicide_name: "Metalaxyl-M (oomycide)",
    fungicide_cost: "Contact local agri-supply shop",
    fungicide_why: "Metalaxyl-M is a systemic oomycete-specific fungicide targeting Phytophthora spp. No current Hayleys catalog match — consult your local agri-supply shop.",
    active_ingredient: "Metalaxyl-M",
    hayleys_product_url: "",
    alert_context: "Waterlogging dramatically increases Phytophthora blight risk in pepper.",
    alert_action: "Improve drainage channels immediately and apply systemic fungicide.",
  },
  cassava: {
    disease_name: "Cassava Mosaic Disease",
    description: "Caused by Sri Lankan Cassava Mosaic Virus (SLCMV); chlorotic mosaic patterns on leaves, leaf distortion, and stunted growth.",
    treatment_steps: [
      "Remove and destroy all infected plants immediately — no chemical cure exists.",
      "Plant only certified virus-free planting material.",
      "Control whitefly (vector) with Admire Imidacloprid at label rates.",
    ],
    timeline: "No recovery for infected plants; manage spread over 4–6 weeks",
    prevention: "Use certified SLCMV-tolerant varieties; rogue out infected plants early; control whitefly.",
    fungicide_name: "Admire Imidacloprid",
    fungicide_cost: "Contact dealer for pricing",
    fungicide_why: "Imidacloprid is the primary control for Bemisia tabaci, the whitefly vector of Cassava Mosaic Virus — systemic neonicotinoid listed for sucking pest control.",
    active_ingredient: "Imidacloprid 200g/L SL",
    hayleys_product_url: "https://www.hayleysagriculture.com/admire-imidacloprid/",
    alert_context: "Dry conditions favour whitefly build-up and virus spread.",
    alert_action: "Apply whitefly control spray and inspect neighbouring fields for infection.",
  },
  corn: {
    disease_name: "Northern Corn Leaf Blight",
    description: "Caused by Setosphaeria turcica; long, cigar-shaped grey-green lesions on leaves, reducing photosynthetic area and grain fill.",
    treatment_steps: [
      "Apply a triazole fungicide (e.g. Propiconazole) at first sign of lesions.",
      "Remove severely infected lower leaves to reduce fungal inoculum.",
      "Ensure adequate potassium fertilisation to strengthen plant resistance.",
    ],
    timeline: "Spread controlled within 10–14 days with correct fungicide application",
    prevention: "Use resistant hybrids; practice crop rotation; avoid dense planting.",
    fungicide_name: "Triazole fungicide (Propiconazole)",
    fungicide_cost: "Contact local agri-supply shop",
    fungicide_why: "Systemic triazole effective against Setosphaeria turcica. No current Hayleys catalog match — consult your local agri-supply shop.",
    active_ingredient: "Propiconazole",
    hayleys_product_url: "",
    alert_context: "Wet, humid weather accelerates Northern Leaf Blight spread in corn fields.",
    alert_action: "Apply fungicide before next rainfall event and improve field drainage.",
  },
};

const FALLBACK_CROP_KEY = "rice";

// ---------------------------------------------------------------------------
// Sliding-window IP rate limiter — first line of defense before the request
// reaches Python/Gemini. In-memory; resets on process restart (known limitation
// under horizontal scaling — use a shared store like Redis for multi-instance).
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
// Uses crop_type to pick plausible disease data so the mock is self-consistent.
// Clearly tagged with is_mock:true and a [DEMO] prefix so it cannot be
// mistaken for a real diagnosis in the UI or in automated tests.
// ---------------------------------------------------------------------------
function buildMockResult(query: AgentQuery): OrchestrationResult {
  const data =
    CROP_MOCK_DATA[query.crop_type.toLowerCase()] ?? CROP_MOCK_DATA[FALLBACK_CROP_KEY];

  return {
    is_mock: true,
    situation_summary: `[DEMO] Your ${query.crop_type} crop in ${query.region} has been diagnosed with ${data.disease_name}. This is a local demo result — set AGENT_URL to use the real AI backend.`,
    diagnosis: {
      disease_name: data.disease_name,
      confidence: 0.85,
      description: data.description,
      treatment_steps: data.treatment_steps,
      timeline: data.timeline,
      prevention: data.prevention,
      risk_level: "high",
      crop_disease_mismatch_warning: false,
    },
    weather: {
      current_weather: { temperature: 27.8, humidity: 82, rainfall_7d: 86.2 },
      alerts: [
        {
          risk_type: "WATERLOGGING",
          likelihood: "high",
          days_ahead: 2,
          context: data.alert_context,
          action: data.alert_action,
        },
      ],
      forecast_summary: "High humidity and incoming rain create elevated disease risk. Act promptly.",
    },
    resources: {
      recommendations: [
        {
          type: "fungicide",
          product_name: data.fungicide_name,
          active_ingredient: data.active_ingredient,
          why: data.fungicide_why,
          availability: data.hayleys_product_url
            ? "Available through Hayleys Agriculture dealers across Sri Lanka."
            : "Available at local agri-supply shops.",
          estimated_cost: data.fungicide_cost,
          application_notes: data.treatment_steps[0],
          hayleys_product_url: data.hayleys_product_url,
          dealer_url: data.hayleys_product_url
            ? "https://www.hayleysagriculture.com/dealer-locater/"
            : "",
        },
      ],
      priority_note: `[DEMO] Source ${data.fungicide_name} and begin treatment promptly.`,
    },
    action_plan: [
      `[DEMO] ${data.treatment_steps[0]}`,
      ...data.treatment_steps.slice(1),
      `Recheck your crop in ${data.timeline} to assess recovery.`,
    ],
    timeline: data.timeline,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrchestrationResult | { error: string; retryAfterSec?: number }>
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

  const query = req.body as AgentQuery;
  const { crop_type, symptoms, image_base64, region } = query;

  if (!crop_type || !symptoms || !image_base64 || !region) {
    return res.status(400).json({
      error: "Missing required fields: crop_type, symptoms, image_base64, region",
    });
  }

  // If AGENT_URL is configured, proxy to the live Python backend.
  // Strip trailing slash so ${agentUrl}/run never becomes //run.
  const agentUrl = process.env.AGENT_URL?.replace(/\/+$/, "");
  if (agentUrl) {
    try {
      const upstream = await fetch(`${agentUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        signal: AbortSignal.timeout(90_000),
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
  // The response is clearly tagged with is_mock:true; it must never be treated
  // as a real diagnosis. Kept separate from the "no config" path so that a
  // misconfigured production environment always surfaces an error.
  if (process.env.MOCK_MODE === "true") {
    return res.status(200).json(buildMockResult(query));
  }

  // Neither a live backend nor explicit mock mode is configured.
  // Return a clear service-unavailable error rather than silently serving
  // fabricated (and potentially wrong) farming advice.
  return res.status(503).json({
    error:
      "Diagnosis service is not configured. " +
      "Set AGENT_URL to point to the Python backend, " +
      "or set MOCK_MODE=true to enable the local demo mode.",
  });
}
