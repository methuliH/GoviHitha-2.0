import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { MarketPriceResult } from "@/lib/types";
import SharedNav from "@/components/layout/SharedNav";
import AgentProgress from "@/components/loading/AgentProgress";
import styles from "@/styles/results.module.css";

// ── Demo fallback ─────────────────────────────────────────────────────────────

const SAMPLE: MarketPriceResult = {
  crop_type: "rice",
  unit: "per kg (paddy)",
  todays_price_lkr: 108.5,
  avg_price_30d_lkr: 100.0,
  price_change_pct: 8.5,
  trend: "up",
  advisory: "Prices are 8% above the recent average for rice — a good time to sell if you have stock ready.",
  last_updated: new Date().toISOString().slice(0, 10),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function trendStyle(trend: string): { color: string; bg: string; icon: string; label: string } {
  if (trend === "up") return { color: "#fff", bg: "#5a8a4a", icon: "↑", label: "Trending up" };
  if (trend === "down") return { color: "#fff", bg: "#c0392b", icon: "↓", label: "Trending down" };
  return { color: "#F0E7D5", bg: "#31572C", icon: "→", label: "Stable" };
}

function fmtLkr(n: number): string {
  return n.toLocaleString("en-LK", { maximumFractionDigits: 2 });
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

type ResultState = MarketPriceResult | null | undefined;

export default function MarketResults() {
  const [result, setResult] = useState<ResultState>(undefined);

  useEffect(() => {
    const stored = sessionStorage.getItem("govihitha_price");
    if (stored) {
      try { setResult(JSON.parse(stored) as MarketPriceResult); }
      catch { setResult(null); }
    } else {
      setResult(null);
    }
  }, []);

  if (result === undefined) return <AgentProgress />;

  const data = result ?? SAMPLE;
  const isDemo = result === null;
  const trend = trendStyle(data.trend);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 0%, #4a7c43 0%, #31572C 48%, #1e3a18 100%)", display: "flex", flexDirection: "column", position: "relative", fontFamily: "'Outfit', sans-serif" }}>

      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle, rgba(144,169,85,0.13) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 0 }} />

      <SharedNav />

      <main className={styles.pageMain} style={{ position: "relative", zIndex: 1, flex: 1, maxWidth: 760, margin: "0 auto", width: "100%" }}>

        {isDemo && (
          <div style={{ background: "rgba(217,119,6,0.18)", border: "1px solid rgba(217,119,6,0.4)", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <p style={{ margin: 0, font: "400 14px 'Outfit'", color: "#FAF9F6" }}>
              Showing <strong>sample results</strong>.{" "}
              <Link href="/market" style={{ color: "#ECF39E", fontWeight: 600 }}>Check a real price</Link>{" "}
              to see live data.
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
            <div style={{ font: "700 16px 'Outfit'", color: "#1e3a18", marginBottom: 4, textTransform: "capitalize" }}>Today&apos;s {data.crop_type} price</div>
            <div style={{ font: "400 14px/1.5 'Outfit'", color: "rgba(30,58,24,0.65)" }}>
              Last updated {data.last_updated}
            </div>
          </div>
          <Link href="/market" className={styles.summaryBtn}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#F0E7D5" strokeWidth="1.7" />
              <line x1="10" y1="10" x2="13.5" y2="13.5" stroke="#F0E7D5" strokeWidth="1.9" strokeLinecap="round" />
              <line x1="6.5" y1="4" x2="6.5" y2="9" stroke="#F0E7D5" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="#F0E7D5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Check another crop
          </Link>
        </div>

        {/* Page heading */}
        <div className={styles.fadeUp2} style={{ marginBottom: 28 }}>
          <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>MARKET PRICE</span>
          <h1 style={{ margin: "10px 0 6px", font: "400 clamp(24px,5vw,48px)/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>
            LKR {fmtLkr(data.todays_price_lkr)}<span style={{ color: "#ECF39E" }}>.</span>
          </h1>
          <p style={{ margin: 0, font: "400 15px 'Outfit'", color: "rgba(250,249,246,0.5)" }}>
            {data.unit}
          </p>
        </div>

        {/* ── PRICE CARD ── */}
        <div className={`${styles.fadeUp3} ${styles.sectionCard}`} style={{ background: "#F0E7D5", borderRadius: 28, marginBottom: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}>
          <SectionHeader
            label="PRICE COMPARISON"
            title={`${trend.icon} ${Math.abs(data.price_change_pct).toFixed(1)}% vs. average`}
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 17L8 10L13 14L19 4" stroke="#ECF39E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />

          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ font: "600 11px 'Outfit'", borderRadius: "100px", padding: "5px 14px", background: trend.bg, color: trend.color }}>
              {trend.icon} {trend.label}
            </span>
          </div>

          <div className={styles.diagInnerGrid} style={{ marginBottom: 24 }}>
            <div style={{ background: "rgba(49,87,44,0.08)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 8 }}>TODAY&apos;S PRICE</div>
              <div style={{ font: "700 24px 'Fraunces'", color: "#1e3a18" }}>LKR {fmtLkr(data.todays_price_lkr)}</div>
            </div>
            <div style={{ background: "rgba(49,87,44,0.08)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 8 }}>30-DAY AVERAGE</div>
              <div style={{ font: "700 24px 'Fraunces'", color: "#1e3a18" }}>LKR {fmtLkr(data.avg_price_30d_lkr)}</div>
            </div>
          </div>

          <div style={{ background: "#31572C", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ font: "600 10px 'Outfit'", color: "#90A955", letterSpacing: "0.16em", marginBottom: 8 }}>BEFORE YOU NEGOTIATE</div>
            <p style={{ margin: 0, font: "400 14px/1.65 'Outfit'", color: "#FAF9F6" }}>{data.advisory}</p>
          </div>
        </div>

        {/* Cross-link */}
        <div className={styles.fadeUp4} style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
          <Link href="/diagnose" style={{ font: "500 14px 'Outfit'", color: "rgba(250,249,246,0.6)", textDecoration: "underline" }}>
            Diagnose a crop issue →
          </Link>
          <Link href="/advisor" style={{ font: "500 14px 'Outfit'", color: "rgba(250,249,246,0.6)", textDecoration: "underline" }}>
            Plan your planting →
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

MarketResults.getLayout = (page: ReactElement) => page;
