import type { ReactElement } from "react";
import { useState } from "react";
import { useRouter } from "next/router";
import type { MarketQuery } from "@/lib/types";
import { useMarketPrice } from "@/hooks/useMarketPrice";
import { CROP_TYPES, type CropType } from "@/lib/constants";
import SharedNav from "@/components/layout/SharedNav";
import styles from "@/styles/diagnose.module.css";

// ── Page layout shell (duplicated per-page, same as advisor.tsx) ────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 0%, #4a7c43 0%, #31572C 48%, #1e3a18 100%)", position: "relative", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle, rgba(144,169,85,0.13) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 0 }} />
      <SharedNav />
      <main style={{ position: "relative", zIndex: 1, flex: 1 }}>
        <div style={{ position: "fixed", inset: "64px 0 0 0", zIndex: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/farmland-bg.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(20,44,16,0.62)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(74,124,67,0.35) 0%, transparent 70%)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px 80px" }}>
          {children}
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

// ── Loading state ─────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <PageShell>
      <div style={{ textAlign: "center", marginBottom: 36 }} className={styles.fadeUp1}>
        <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>MARKET PRICES</span>
        <h1 style={{ margin: "14px 0 12px", font: "400 58px/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>Checking…</h1>
      </div>
      <div style={{ width: "100%", maxWidth: 560 }} className={styles.fadeUp2}>
        <div style={{ background: "#F0E7D5", borderRadius: 28, padding: "44px 48px", boxShadow: "0 32px 80px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid rgba(49,87,44,0.15)", borderTop: "4px solid #31572C", animation: "spin 1s linear infinite" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", font: "22px serif" }}>💰</div>
          </div>
          <p style={{ font: "600 16px 'Outfit'", color: "#1e3a18", margin: 0 }}>Looking up today&apos;s price…</p>
        </div>
      </div>
    </PageShell>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

function MarketForm({ onSubmit, error }: { onSubmit: (q: MarketQuery) => void; error: string | null }) {
  const [crop, setCrop] = useState<CropType | "">("");
  const isValid = crop !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ crop_type: crop });
  };

  return (
    <PageShell>
      <div style={{ textAlign: "center", marginBottom: 36 }} className={styles.fadeUp1}>
        <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>MARKET PRICES</span>
        <h1 style={{ margin: "14px 0 12px", font: "400 clamp(28px,6vw,58px)/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>Check today&apos;s price.</h1>
        <p style={{ margin: 0, font: "400 16px/1.7 'Outfit'", color: "rgba(250,249,246,0.62)", maxWidth: 460 }}>
          One tap — see today&apos;s farm-gate price vs. the recent average before you negotiate.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 560 }} className={styles.fadeUp2}>
        {error && (
          <div style={{ background: "rgba(185,28,28,0.15)", border: "1px solid rgba(185,28,28,0.35)", borderRadius: 14, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ font: "600 14px 'Outfit'", color: "#FAF9F6", margin: "0 0 4px" }}>Price check failed</p>
              <p style={{ font: "400 13px 'Outfit'", color: "rgba(250,249,246,0.75)", margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formCard} style={{ background: "#F0E7D5", borderRadius: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.45)" }}>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", font: "600 13px 'Outfit'", color: "#1e3a18", letterSpacing: "0.04em", marginBottom: 9 }}>
              CROP TYPE <span style={{ color: "#5a8a4a" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value as CropType)}
                className={styles.fieldInput}
                style={{ color: crop ? "#1e3a18" : "rgba(30,58,24,0.4)" }}
              >
                <option value="" disabled>Select crop…</option>
                {CROP_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6 L8 10 L12 6" stroke="#5a8a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(49,87,44,0.12)", marginBottom: 28 }} />

          <button type="submit" disabled={!isValid} className={styles.submitBtn}>
            Check today&apos;s price
          </button>
          {!isValid && (
            <div style={{ textAlign: "center", font: "400 13px 'Outfit'", color: "rgba(30,58,24,0.4)", marginTop: 14 }}>
              Select a crop to continue
            </div>
          )}
        </form>
      </div>
    </PageShell>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const router = useRouter();
  const { status, error, submit } = useMarketPrice();
  const isLoading = status === "loading";

  const handleSubmit = async (query: MarketQuery) => {
    const result = await submit(query);
    if (result) {
      sessionStorage.setItem("govihitha_price", JSON.stringify(result));
      await router.push("/market-results");
    }
  };

  if (isLoading) return <LoadingView />;

  return <MarketForm onSubmit={handleSubmit} error={status === "error" ? (error ?? "Something went wrong.") : null} />;
}

MarketPage.getLayout = (page: ReactElement) => page;
