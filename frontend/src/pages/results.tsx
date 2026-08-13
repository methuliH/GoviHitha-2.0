import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { OrchestrationResult, WeatherAlert } from "@/lib/types";
import SharedNav from "@/components/layout/SharedNav";
import AgentProgress from "@/components/loading/AgentProgress";
import styles from "@/styles/results.module.css";

// ── Demo fallback ─────────────────────────────────────────────────────────────

const SAMPLE: OrchestrationResult = {
  situation_summary:
    "Your rice crop in Colombo has been diagnosed with Rice Leaf Blast. Waterlogging risk (high) in 2 days will worsen the situation. Immediate action required.",
  diagnosis: {
    disease_name: "Rice Leaf Blast",
    confidence: 0.92,
    description:
      "Fungal infection caused by Magnaporthe oryzae, common in humid Sri Lankan rice-growing regions. Spreads rapidly in warm, humid conditions.",
    treatment_steps: [
      "Apply Tricyclazole 75% WP fungicide at 0.6g per litre of water",
      "Improve field drainage to reduce standing water",
      "Remove and destroy infected plant material immediately",
    ],
    timeline: "7–10 days with consistent treatment",
    prevention:
      "Use blast-resistant varieties, avoid excess nitrogen fertiliser, rotate crops each season.",
    risk_level: "high",
  },
  weather: {
    current_weather: { temperature: 27.8, humidity: 82, rainfall_7d: 86.2 },
    alerts: [
      {
        risk_type: "WATERLOGGING",
        likelihood: "high",
        days_ahead: 2,
        context: "Heavy rain in 48h will accelerate fungal spread in waterlogged paddy fields.",
        action: "Improve field drainage immediately and apply fungicide before rain arrives.",
      },
    ],
    forecast_summary:
      "High humidity and incoming heavy rain create high-risk conditions. Act today.",
  },
  resources: {
    recommendations: [
      {
        type: "fungicide",
        product_name: "Folicur Tebuconazole",
        active_ingredient: "Tebuconazole 250g/L EW",
        why: "Tebuconazole is explicitly listed for Rice Blast in paddy — systemic triazole with protective and curative action against Magnaporthe oryzae.",
        availability: "Available through Hayleys Agriculture dealers across Sri Lanka.",
        estimated_cost: "Contact dealer for pricing",
        application_notes: "Systemic fungicide with protective and curative action; foliar application. Pre-harvest interval 21 days.",
        hayleys_product_url: "https://www.hayleysagriculture.com/folicur-tebuconazole/",
        dealer_url: "https://www.hayleysagriculture.com/dealer-locater/",
      },
    ],
    priority_note:
      "Source Folicur Tebuconazole from a Hayleys Agriculture dealer as soon as possible. Waterlogging risk expected in 2 day(s) — apply treatment before conditions worsen.",
  },
  action_plan: [
    "Buy Tricyclazole 75% WP today (1,200–2,500 LKR) — directly targets the diagnosed fungal infection",
    "Apply Tricyclazole at 0.6g per litre of water across all affected areas",
    "Improve field drainage immediately before heavy rain arrives in 48h",
    "Remove and destroy all visibly infected plant material",
    "Recheck your crop in 7–10 days to assess recovery",
  ],
  timeline: "7–10 days with treatment",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractCropRegion(summary: string): { crop: string; region: string } {
  const m = summary.match(/Your (.+?) crop in (.+?) has/i);
  return { crop: m?.[1] ?? "crop", region: m?.[2] ?? "" };
}

function topAlert(alerts: WeatherAlert[]): WeatherAlert | null {
  const highs = alerts.filter((a) => a.likelihood === "high");
  return highs[0] ?? alerts[0] ?? null;
}

function rainLabel(alert: WeatherAlert | null, rainfall_7d: number): { label: string; sub: string; danger: boolean } {
  if (alert) {
    const d = alert.days_ahead;
    const sub = d === 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`;
    return { label: alert.likelihood === "high" ? "Heavy" : "Moderate", sub, danger: alert.likelihood === "high" };
  }
  return {
    label: `${Math.round(rainfall_7d)}mm`,
    sub: "Last 7 days",
    danger: rainfall_7d > 80,
  };
}

function tempLabel(t: number): string {
  if (t < 18) return "Cool today";
  if (t < 24) return "Mild today";
  if (t < 30) return "Warm today";
  return "Hot today";
}

function humidityLabel(h: number): string {
  if (h < 50) return "Comfortable";
  if (h < 70) return "Moderate";
  if (h < 85) return "Humid";
  return "Very humid";
}

function riskBadgeStyle(level: string): React.CSSProperties {
  if (level === "high") return { background: "#c0392b", color: "#fff" };
  if (level === "low") return { background: "#5a8a4a", color: "#fff" };
  return { background: "#d97706", color: "#fff" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 44, height: 44, background: "#31572C", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {children}
    </div>
  );
}

function SectionHeader({ label, title, icon }: { label: string; title: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
      <SectionIcon>{icon}</SectionIcon>
      <div>
        <div style={{ font: "600 11px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.18em" }}>{label}</div>
        <div style={{ font: "400 28px/1.1 'Fraunces'", color: "#1e3a18", letterSpacing: "-0.02em" }}>{title}</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ResultState = OrchestrationResult | null | undefined;

export default function Results() {
  const [result, setResult] = useState<ResultState>(undefined);

  useEffect(() => {
    const stored = sessionStorage.getItem("govihitha_result");
    if (stored) {
      try { setResult(JSON.parse(stored) as OrchestrationResult); }
      catch { setResult(null); }
    } else {
      setResult(null);
    }
  }, []);

  if (result === undefined) return <AgentProgress />;

  const data = result ?? SAMPLE;
  const isDemo = result === null;
  const { crop, region } = extractCropRegion(data.situation_summary);
  const confidence = Math.round(data.diagnosis.confidence * 100);
  const alert = topAlert(data.weather.alerts);
  const rain = rainLabel(alert, data.weather.current_weather.rainfall_7d);
  const temp = data.weather.current_weather.temperature;
  const humidity = data.weather.current_weather.humidity;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 0%, #4a7c43 0%, #31572C 48%, #1e3a18 100%)", display: "flex", flexDirection: "column", position: "relative", fontFamily: "'Outfit', sans-serif" }}>

      {/* Dot texture */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle, rgba(144,169,85,0.13) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 0 }} />

      <SharedNav />

      <main className={styles.pageMain} style={{ position: "relative", zIndex: 1, flex: 1, maxWidth: 1160, margin: "0 auto", width: "100%" }}>

        {/* Demo banner */}
        {isDemo && (
          <div style={{ background: "rgba(217,119,6,0.18)", border: "1px solid rgba(217,119,6,0.4)", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <p style={{ margin: 0, font: "400 14px 'Outfit'", color: "#FAF9F6" }}>
              Showing <strong>sample results</strong>.{" "}
              <Link href="/diagnose" style={{ color: "#ECF39E", fontWeight: 600 }}>Diagnose your crop</Link>{" "}
              to see real data.
            </p>
          </div>
        )}

        {/* Summary banner */}
        <div className={`${styles.fadeUp1} ${styles.summaryBanner}`} style={{ background: "#F0E7D5", borderRadius: 22, marginBottom: 28, boxShadow: "0 12px 40px rgba(0,0,0,0.22)" }}>
          <div style={{ width: 52, height: 52, background: "#31572C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#ECF39E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "700 16px 'Outfit'", color: "#1e3a18", marginBottom: 4 }}>We found what&apos;s wrong with your crop</div>
            <div style={{ font: "400 14px/1.5 'Outfit'", color: "rgba(30,58,24,0.65)" }}>
              Your {crop} in {region || "Sri Lanka"} has <span style={{ color: "#31572C", fontWeight: 600 }}>{data.diagnosis.disease_name}</span>. Scroll down to see exactly what to do.
            </div>
          </div>
          <Link href="/diagnose" className={styles.summaryBtn}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#F0E7D5" strokeWidth="1.7" />
              <line x1="10" y1="10" x2="13.5" y2="13.5" stroke="#F0E7D5" strokeWidth="1.9" strokeLinecap="round" />
              <line x1="6.5" y1="4" x2="6.5" y2="9" stroke="#F0E7D5" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="#F0E7D5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New diagnosis
          </Link>
        </div>

        {/* Page heading */}
        <div className={styles.fadeUp2} style={{ marginBottom: 28 }}>
          <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>YOUR RESULTS</span>
          <h1 style={{ margin: "10px 0 6px", font: "400 clamp(24px,5vw,48px)/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>
            {data.diagnosis.disease_name}<span style={{ color: "#ECF39E" }}>.</span>
          </h1>
          <p style={{ margin: 0, font: "400 15px 'Outfit'", color: "rgba(250,249,246,0.5)", textTransform: "capitalize" }}>
            {crop} crop{region ? ` · ${region}` : ""}
          </p>
        </div>

        {/* ── ACTION PLAN ── */}
        <div className={`${styles.fadeUp3} ${styles.sectionCard}`} style={{ background: "#F0E7D5", borderRadius: 28, marginBottom: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}>
          <SectionHeader
            label="YOUR ACTION PLAN"
            title={`${data.action_plan.length} Steps to recovery`}
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11h14M11 4l7 7-7 7" stroke="#ECF39E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />

          {/* Situation banner */}
          <div style={{ background: "rgba(49,87,44,0.1)", border: "1px solid rgba(49,87,44,0.18)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.16em", marginBottom: 6 }}>SITUATION</div>
            <p style={{ margin: 0, font: "400 14px/1.65 'Outfit'", color: "#1e3a18" }}>{data.situation_summary}</p>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Step 1 — highlighted */}
            <div style={{ background: "#31572C", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 32, height: 32, background: "#ECF39E", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, font: "700 14px 'Outfit'", color: "#31572C" }}>1</div>
              <div>
                <div style={{ font: "600 10px 'Outfit'", color: "#90A955", letterSpacing: "0.16em", marginBottom: 4 }}>DO FIRST</div>
                <div style={{ font: "500 14px/1.5 'Outfit'", color: "#FAF9F6" }}>{data.action_plan[0]}</div>
              </div>
            </div>

            {/* Steps 2+ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.action_plan.slice(1).map((step, i) => (
                <div key={i} className={styles.actionStep}>
                  <div style={{ width: 28, height: 28, background: "rgba(49,87,44,0.12)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, font: "600 13px 'Outfit'", color: "#31572C" }}>{i + 2}</div>
                  <span style={{ font: "400 14px 'Outfit'", color: "#1e3a18" }}>{step}</span>
                </div>
              ))}
            </div>

            {/* Recovery row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, padding: "14px 20px", background: "rgba(144,169,85,0.1)", borderRadius: 12, border: "1px solid rgba(144,169,85,0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7.5" stroke="#5a8a4a" strokeWidth="1.5" />
                <path d="M9 5.5v4l2.5 2" stroke="#5a8a4a" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <span style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em" }}>EXPECTED RECOVERY · </span>
                <span style={{ font: "400 13px 'Outfit'", color: "#1e3a18" }}>{data.timeline}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── DIAGNOSIS + WEATHER ROW ── */}
        <div className={`${styles.fadeUp4} ${styles.diagWeatherGrid}`}>

          {/* Diagnosis card */}
          <div className={styles.diagCard} style={{ background: "#F0E7D5", borderRadius: 24, boxShadow: "0 16px 50px rgba(0,0,0,0.22)" }}>
            <div style={{ font: "600 11px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.18em", marginBottom: 6 }}>DIAGNOSIS</div>
            <div style={{ font: "400 clamp(20px,4vw,32px)/1.1 'Fraunces'", color: "#1e3a18", letterSpacing: "-0.02em", marginBottom: 22 }}>{data.diagnosis.disease_name}</div>

            {/* Confidence bar */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em" }}>CONFIDENCE</span>
                <span style={{ font: "600 11px 'Outfit'", borderRadius: "100px", padding: "3px 10px", ...riskBadgeStyle(data.diagnosis.risk_level ?? "medium") }}>
                  {data.diagnosis.risk_level ?? "medium"} risk
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(49,87,44,0.12)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  className={styles.barFill}
                  style={{ ["--bar-width" as string]: `${confidence}%` }}
                />
              </div>
              <div style={{ font: "700 13px 'Outfit'", color: "#31572C", marginTop: 5, textAlign: "right" }}>{confidence}%</div>
            </div>

            {/* What it is */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 7 }}>WHAT IT IS</div>
              <p style={{ margin: 0, font: "400 13px/1.65 'Outfit'", color: "rgba(30,58,24,0.72)" }}>{data.diagnosis.description}</p>
            </div>

            {/* Treatment steps */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 10 }}>TREATMENT STEPS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {data.diagnosis.treatment_steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ width: 18, height: 18, background: "#31572C", borderRadius: "50%", color: "#F0E7D5", font: "600 10px 'Outfit'", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ font: "400 13px/1.5 'Outfit'", color: "#1e3a18" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline + Prevention */}
            <div className={styles.diagInnerGrid}>
              <div style={{ background: "rgba(49,87,44,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 6 }}>RECOVERY TIMELINE</div>
                <div style={{ font: "400 13px/1.5 'Outfit'", color: "#1e3a18" }}>{data.diagnosis.timeline}</div>
              </div>
              <div style={{ background: "rgba(49,87,44,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 6 }}>PREVENTION</div>
                <div style={{ font: "400 13px/1.5 'Outfit'", color: "#1e3a18" }}>{data.diagnosis.prevention}</div>
              </div>
            </div>
          </div>

          {/* Weather card */}
          <div className={styles.weatherCard} style={{ background: "#31572C", borderRadius: 24, boxShadow: "0 16px 50px rgba(0,0,0,0.28)", display: "flex", flexDirection: "column" }}>
            <div>
              <div style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.18em", marginBottom: 6 }}>TODAY&apos;S WEATHER</div>
              <div style={{ font: "400 32px/1.1 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.02em" }}>{region || "Sri Lanka"}</div>
            </div>

            {/* 3 weather tiles */}
            <div className={styles.weatherTiles}>

              {/* Temperature */}
              <div style={{ background: "rgba(250,249,246,0.1)", borderRadius: 14, padding: "18px 10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="11" y="4" width="6" height="14" rx="3" fill="none" stroke="#ECF39E" strokeWidth="1.6" />
                  <circle cx="14" cy="21" r="4" fill="#ECF39E" opacity="0.9" />
                  <rect x="12.5" y="10" width="3" height="8" rx="1.5" fill="#ECF39E" opacity="0.85" />
                </svg>
                <div style={{ font: "700 26px/1 'Fraunces'", color: "#ECF39E" }}>{Math.round(temp)}°</div>
                <div style={{ font: "500 13px 'Outfit'", color: "rgba(250,249,246,0.7)", lineHeight: 1.3 }}>{tempLabel(temp)}</div>
              </div>

              {/* Humidity */}
              <div style={{ background: "rgba(250,249,246,0.1)", borderRadius: 14, padding: "18px 10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className={styles.humiDrop}>
                  <path d="M14 4 Q8 12 8 17 A6 6 0 0 0 20 17 Q20 12 14 4Z" fill="rgba(236,243,158,0.25)" stroke="#ECF39E" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M11 17 Q12 15 14 15" stroke="#ECF39E" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <div style={{ font: "700 26px/1 'Fraunces'", color: "#ECF39E" }}>{Math.round(humidity)}%</div>
                <div style={{ font: "500 13px 'Outfit'", color: "rgba(250,249,246,0.7)", lineHeight: 1.3 }}>{humidityLabel(humidity)}</div>
              </div>

              {/* Rain */}
              <div
                className={rain.danger ? styles.warnTile : ""}
                style={{
                  background: rain.danger ? "rgba(192,57,43,0.3)" : "rgba(250,249,246,0.1)",
                  border: rain.danger ? "1.5px solid rgba(255,120,100,0.4)" : "none",
                  borderRadius: 14,
                  padding: "18px 10px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" overflow="visible">
                  <path d="M5 18Q5 13 9 13Q9 8 13 8Q20 8 20 13.5Q23 13.5 23 18Z" fill="none" stroke="#ECF39E" strokeWidth="1.6" strokeLinejoin="round" />
                  <line x1="9" y1="21" x2="8" y2="25" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" className={rain.danger ? styles.rainDrop1 : ""} />
                  <line x1="14" y1="21" x2="13" y2="25" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" className={rain.danger ? styles.rainDrop2 : ""} />
                  <line x1="19" y1="21" x2="18" y2="25" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" className={rain.danger ? styles.rainDrop3 : ""} />
                </svg>
                <div style={{ font: "700 22px/1 'Fraunces'", color: "#ECF39E" }}>{rain.label}</div>
                <div style={{ font: "500 13px 'Outfit'", color: "rgba(250,249,246,0.7)", lineHeight: 1.3 }}>{rain.sub}</div>
              </div>
            </div>

            {/* Alert block */}
            {alert && (
              <div style={{ background: "rgba(192,57,43,0.22)", border: "2px solid rgba(255,120,100,0.45)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, background: "#c0392b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2L16.5 15H1.5Z" fill="none" stroke="#FAF9F6" strokeWidth="1.8" strokeLinejoin="round" />
                      <line x1="9" y1="7" x2="9" y2="11" stroke="#FAF9F6" strokeWidth="1.8" strokeLinecap="round" />
                      <circle cx="9" cy="13.5" r="1" fill="#FAF9F6" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ font: "700 15px 'Outfit'", color: "#FAF9F6" }}>
                      {alert.risk_type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())} risk
                      {alert.days_ahead === 0 ? " today" : alert.days_ahead === 1 ? " tomorrow" : ` in ${alert.days_ahead} days`}
                    </div>
                    <div style={{ font: "400 13px 'Outfit'", color: "rgba(250,249,246,0.65)", marginTop: 2 }}>{alert.context}</div>
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.18)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ font: "600 12px 'Outfit'", color: "#ECF39E", marginBottom: 8 }}>What you must do now:</div>
                  <div style={{ font: "400 14px/1.5 'Outfit'", color: "rgba(250,249,246,0.9)" }}>{alert.action}</div>
                </div>
              </div>
            )}

            {/* Forecast summary */}
            <div style={{ background: "rgba(144,169,85,0.15)", border: "1px solid rgba(144,169,85,0.28)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span className={styles.sunBob} style={{ fontSize: 20, flexShrink: 0, display: "inline-block" }}>☀️</span>
              <span style={{ font: "400 14px/1.5 'Outfit'", color: "rgba(250,249,246,0.85)" }}>{data.weather.forecast_summary}</span>
            </div>
          </div>
        </div>

        {/* ── PRODUCTS ── */}
        <div className={`${styles.fadeUp5} ${styles.sectionCard}`} style={{ background: "#F0E7D5", borderRadius: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}>
          <SectionHeader
            label="PRODUCTS"
            title={`${data.resources.recommendations.length} Recommendation${data.resources.recommendations.length !== 1 ? "s" : ""}`}
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 7L2 19h18L19 7Z" fill="none" stroke="#ECF39E" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M7 7Q7 3.5 11 3.5Q15 3.5 15 7" fill="none" stroke="#ECF39E" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="8" cy="15" r="1.5" fill="#ECF39E" />
                <circle cx="14" cy="15" r="1.5" fill="#ECF39E" />
              </svg>
            }
          />

          {/* Priority banner */}
          <div style={{ background: "#31572C", borderRadius: 14, padding: "14px 20px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L10.8 7H16L11.6 10.2 13.4 15.2 9 12 4.6 15.2 6.4 10.2 2 7H7.2Z" fill="#ECF39E" stroke="#ECF39E" strokeWidth="0.5" strokeLinejoin="round" />
            </svg>
            <p style={{ margin: 0, font: "400 14px/1.5 'Outfit'", color: "#FAF9F6" }}>{data.resources.priority_note}</p>
          </div>

          {/* Product cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.resources.recommendations.map((rec, i) => {
              const isPrimary = i === 0;
              return (
                <div key={i} className={styles.productCard}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        font: "600 11px 'Outfit'",
                        borderRadius: "100px",
                        padding: "4px 13px",
                        letterSpacing: "0.04em",
                        ...(isPrimary
                          ? { background: "#31572C", color: "#F0E7D5" }
                          : { background: "rgba(49,87,44,0.15)", color: "#31572C", border: "1px solid rgba(49,87,44,0.25)" }),
                      }}>
                        {rec.type}
                      </span>
                      <span style={{ font: "600 17px 'Outfit'", color: "#1e3a18" }}>{rec.product_name}</span>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em" }}>ESTIMATED COST</div>
                      <div style={{ font: "700 15px 'Outfit'", color: "#1e3a18" }}>{rec.estimated_cost}</div>
                    </div>
                  </div>

                  <p style={{ margin: "0 0 12px", font: "400 14px/1.6 'Outfit'", color: "rgba(30,58,24,0.7)" }}>{rec.why}</p>

                  {rec.application_notes && (
                    <div style={{ background: "rgba(49,87,44,0.07)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                      <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.12em", marginBottom: 5 }}>HOW TO USE</div>
                      <div style={{ font: "400 13px 'Outfit'", color: "rgba(30,58,24,0.72)" }}>{rec.application_notes}</div>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ font: "400 13px 'Outfit'", color: "#5a8a4a" }}>{rec.availability}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      {rec.hayleys_product_url && (
                        <a
                          href={rec.hayleys_product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.kaprukaBtnSecondary}
                        >
                          Find on Hayleys →
                        </a>
                      )}
                      {rec.dealer_url && (
                        <a
                          href={rec.dealer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.kaprukaBtnPrimary}
                        >
                          Find a Dealer
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(144,169,85,0.18)", padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ font: "700 14px 'Outfit'", color: "#ECF39E" }}>GoviHitha</span>
          <span style={{ font: "400 14px 'Outfit'", color: "rgba(144,169,85,0.8)" }}> — AI-powered crop advisory for Sri Lankan farmers</span>
        </div>
        <div style={{ font: "400 13px 'Outfit'", color: "rgba(144,169,85,0.55)" }}>Powered by Gemini · OpenMeteo · Google ADK</div>
      </footer>
    </div>
  );
}

Results.getLayout = (page: ReactElement) => page;
