import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PlantingAdvice } from "@/lib/types";
import SharedNav from "@/components/layout/SharedNav";
import AgentProgress from "@/components/loading/AgentProgress";
import styles from "@/styles/results.module.css";

// ── Demo fallback ─────────────────────────────────────────────────────────────

const SAMPLE: PlantingAdvice = {
  crop_type: "rice",
  region: "Anuradhapura",
  recommended_variety: {
    variety_name: "Bg 300",
    reason: "Short-duration and drought-tolerant, well suited to this dry-zone district's variable rainfall.",
    days_to_maturity: 105,
  },
  sowing_window_label: "22 Aug - 5 Sep",
  sowing_window_start: "2026-08-22",
  sowing_window_end: "2026-09-05",
  season: "Yala",
  risk_notes: [
    "A dry spell is forecast in the first week of the window — irrigate at sowing if possible.",
  ],
  confidence: "medium",
  advisory_summary: "Bg 300 balances a short growth cycle with drought tolerance, reducing exposure to the dry stretch forecast partway through the window.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceBadgeStyle(level: string): React.CSSProperties {
  if (level === "high") return { background: "#5a8a4a", color: "#fff" };
  if (level === "low") return { background: "#d97706", color: "#fff" };
  return { background: "#31572C", color: "#F0E7D5" };
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysFromToday(iso: string): number {
  const target = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
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

type ResultState = PlantingAdvice | null | undefined;

export default function AdvisorResults() {
  const [result, setResult] = useState<ResultState>(undefined);

  useEffect(() => {
    const stored = sessionStorage.getItem("govihitha_advice");
    if (stored) {
      try { setResult(JSON.parse(stored) as PlantingAdvice); }
      catch { setResult(null); }
    } else {
      setResult(null);
    }
  }, []);

  if (result === undefined) return <AgentProgress />;

  const data = result ?? SAMPLE;
  const isDemo = result === null;
  const { crop_type, region, recommended_variety, season, confidence } = data;
  const startsIn = daysFromToday(data.sowing_window_start);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 0%, #4a7c43 0%, #31572C 48%, #1e3a18 100%)", display: "flex", flexDirection: "column", position: "relative", fontFamily: "'Outfit', sans-serif" }}>

      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle, rgba(144,169,85,0.13) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 0 }} />

      <SharedNav />

      <main className={styles.pageMain} style={{ position: "relative", zIndex: 1, flex: 1, maxWidth: 900, margin: "0 auto", width: "100%" }}>

        {isDemo && (
          <div style={{ background: "rgba(217,119,6,0.18)", border: "1px solid rgba(217,119,6,0.4)", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <p style={{ margin: 0, font: "400 14px 'Outfit'", color: "#FAF9F6" }}>
              Showing <strong>sample results</strong>.{" "}
              <Link href="/advisor" style={{ color: "#ECF39E", fontWeight: 600 }}>Plan your season</Link>{" "}
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
            <div style={{ font: "700 16px 'Outfit'", color: "#1e3a18", marginBottom: 4 }}>Your season plan is ready</div>
            <div style={{ font: "400 14px/1.5 'Outfit'", color: "rgba(30,58,24,0.65)" }}>
              For {crop_type} in {region || "Sri Lanka"}, we recommend <span style={{ color: "#31572C", fontWeight: 600 }}>{recommended_variety.variety_name}</span>.
            </div>
          </div>
          <Link href="/advisor" className={styles.summaryBtn}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#F0E7D5" strokeWidth="1.7" />
              <line x1="10" y1="10" x2="13.5" y2="13.5" stroke="#F0E7D5" strokeWidth="1.9" strokeLinecap="round" />
              <line x1="6.5" y1="4" x2="6.5" y2="9" stroke="#F0E7D5" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="#F0E7D5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New plan
          </Link>
        </div>

        {/* Page heading */}
        <div className={styles.fadeUp2} style={{ marginBottom: 28 }}>
          <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>YOUR PLANTING PLAN</span>
          <h1 style={{ margin: "10px 0 6px", font: "400 clamp(24px,5vw,48px)/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>
            {recommended_variety.variety_name}<span style={{ color: "#ECF39E" }}>.</span>
          </h1>
          <p style={{ margin: 0, font: "400 15px 'Outfit'", color: "rgba(250,249,246,0.5)", textTransform: "capitalize" }}>
            {crop_type} crop{region ? ` · ${region}` : ""} · {season} season
          </p>
        </div>

        {/* ── VARIETY + WINDOW ── */}
        <div className={`${styles.fadeUp3} ${styles.sectionCard}`} style={{ background: "#F0E7D5", borderRadius: 28, marginBottom: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}>
          <SectionHeader
            label="RECOMMENDED VARIETY"
            title={recommended_variety.variety_name}
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 20V8M11 8C11 8 5 8 5 3C10 3 11 8 11 8ZM11 8C11 8 17 8 17 3C12 3 11 8 11 8Z" stroke="#ECF39E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />

          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ font: "600 11px 'Outfit'", borderRadius: "100px", padding: "5px 14px", ...confidenceBadgeStyle(confidence) }}>
              {confidence} confidence
            </span>
            <span style={{ font: "600 11px 'Outfit'", borderRadius: "100px", padding: "5px 14px", background: "rgba(49,87,44,0.12)", color: "#31572C", border: "1px solid rgba(49,87,44,0.22)" }}>
              {season} season
            </span>
            <span style={{ font: "600 11px 'Outfit'", borderRadius: "100px", padding: "5px 14px", background: "rgba(49,87,44,0.12)", color: "#31572C", border: "1px solid rgba(49,87,44,0.22)" }}>
              {recommended_variety.days_to_maturity} days to maturity
            </span>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 7 }}>WHY THIS VARIETY</div>
            <p style={{ margin: 0, font: "400 14px/1.65 'Outfit'", color: "rgba(30,58,24,0.72)" }}>{recommended_variety.reason}</p>
          </div>

          {/* Sowing window */}
          <div style={{ background: "#31572C", borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              <div style={{ font: "600 10px 'Outfit'", color: "#90A955", letterSpacing: "0.16em" }}>SOWING WINDOW</div>
              <div style={{ font: "500 12px 'Outfit'", color: "rgba(250,249,246,0.65)" }}>
                {startsIn <= 0 ? "Starts now" : `Starts in ${startsIn} day${startsIn === 1 ? "" : "s"}`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ font: "600 10px 'Outfit'", color: "#90A955", letterSpacing: "0.1em", marginBottom: 4 }}>FROM</div>
                <div style={{ font: "400 22px 'Fraunces'", color: "#FAF9F6" }}>{fmtDate(data.sowing_window_start)}</div>
              </div>
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 6h17M13 1l5 5-5 5" stroke="#ECF39E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div style={{ font: "600 10px 'Outfit'", color: "#90A955", letterSpacing: "0.1em", marginBottom: 4 }}>TO</div>
                <div style={{ font: "400 22px 'Fraunces'", color: "#FAF9F6" }}>{fmtDate(data.sowing_window_end)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RISK NOTES + SUMMARY ── */}
        <div className={`${styles.fadeUp4} ${styles.sectionCard}`} style={{ background: "#F0E7D5", borderRadius: 28, marginBottom: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}>
          <SectionHeader
            label="ADVISORY"
            title={data.risk_notes.length > 0 ? `${data.risk_notes.length} Risk note${data.risk_notes.length === 1 ? "" : "s"}` : "No notable risks"}
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L20 18H2Z" fill="none" stroke="#ECF39E" strokeWidth="1.6" strokeLinejoin="round" />
                <line x1="11" y1="8" x2="11" y2="13" stroke="#ECF39E" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="11" cy="15.5" r="1.1" fill="#ECF39E" />
              </svg>
            }
          />

          <div style={{ background: "rgba(49,87,44,0.1)", border: "1px solid rgba(49,87,44,0.18)", borderRadius: 14, padding: "16px 20px", marginBottom: data.risk_notes.length > 0 ? 20 : 0 }}>
            <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.16em", marginBottom: 6 }}>SUMMARY</div>
            <p style={{ margin: 0, font: "400 14px/1.65 'Outfit'", color: "#1e3a18" }}>{data.advisory_summary}</p>
          </div>

          {data.risk_notes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.risk_notes.map((note, i) => (
                <div key={i} className={styles.actionStep}>
                  <div style={{ width: 28, height: 28, background: "rgba(217,119,6,0.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>⚠️</div>
                  <span style={{ font: "400 14px 'Outfit'", color: "#1e3a18" }}>{note}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cross-link to diagnosis */}
        <div className={styles.fadeUp5} style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <Link href="/diagnose" style={{ font: "500 14px 'Outfit'", color: "rgba(250,249,246,0.6)", textDecoration: "underline" }}>
            Already planted? Diagnose a crop issue →
          </Link>
        </div>
      </main>

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

AdvisorResults.getLayout = (page: ReactElement) => page;
