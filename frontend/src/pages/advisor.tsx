import type { ReactElement } from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import type { AdvisorQuery } from "@/lib/types";
import { useAdvisor } from "@/hooks/useAdvisor";
import { CROP_TYPES, PROVINCES, type CropType, type Region } from "@/lib/constants";
import SharedNav from "@/components/layout/SharedNav";
import styles from "@/styles/diagnose.module.css";

// ── District picker (duplicated from diagnose.tsx — small, self-contained, ──
// ── kept local per-page rather than shared to avoid touching working code) ──

function DistrictPicker({ value, onChange }: { value: Region | ""; onChange: (v: Region) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${styles.districtTrigger} ${open ? styles.districtTriggerOpen : ""}`}
        style={{ color: value ? "#1e3a18" : "rgba(30,58,24,0.4)" }}
      >
        <span>{value || "Select your district…"}</span>
        <svg
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", flexShrink: 0 }}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6 L8 10 L12 6" stroke="#5a8a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 200,
          background: "#fff", border: "1.5px solid rgba(49,87,44,0.22)", borderRadius: 16,
          padding: 20, boxShadow: "0 20px 60px rgba(30,58,24,0.2)", maxHeight: 340, overflowY: "auto",
        }}>
          {PROVINCES.map((province) => (
            <div key={province.name} style={{ marginBottom: 14 }}>
              <div style={{ font: "600 10px 'Outfit'", color: "#90A955", letterSpacing: "0.18em", marginBottom: 8 }}>
                {province.name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {province.districts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { onChange(d as Region); setOpen(false); }}
                    className={`${styles.districtChip} ${value === d ? styles.districtChipSelected : ""}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page layout shell (duplicated from diagnose.tsx for the same reason) ────

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
        <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>SEASON PLANNER</span>
        <h1 style={{ margin: "14px 0 12px", font: "400 58px/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>Planning…</h1>
      </div>
      <div style={{ width: "100%", maxWidth: 680 }} className={styles.fadeUp2}>
        <div style={{ background: "#F0E7D5", borderRadius: 28, padding: "44px 48px", boxShadow: "0 32px 80px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", border: "4px solid rgba(49,87,44,0.15)", borderTop: "4px solid #31572C", animation: "spin 1s linear infinite" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", font: "24px serif" }}>🌱</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ font: "600 18px 'Outfit'", color: "#1e3a18", margin: "0 0 6px" }}>Building your season plan…</p>
            <p style={{ font: "400 14px 'Outfit'", color: "rgba(30,58,24,0.55)", margin: 0 }}>This usually takes 5–15 seconds</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {["🌾 Comparing crop varieties", "🌦️ Reading 16-day forecast", "📅 Choosing sowing window"].map((step) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(49,87,44,0.08)", border: "1px solid rgba(49,87,44,0.15)", borderRadius: 12, padding: "10px 16px", animation: "pulse 2s ease-in-out infinite" }}>
                <span style={{ font: "400 13px 'Outfit'", color: "#1e3a18" }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

interface FormState {
  crop_type: CropType | "";
  region: Region | "";
}

const EMPTY: FormState = { crop_type: "", region: "" };

function AdvisorForm({ onSubmit, error }: { onSubmit: (q: AdvisorQuery) => void; error: string | null }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const isValid = form.crop_type !== "" && form.region !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ crop_type: form.crop_type as CropType, region: form.region as Region });
  };

  return (
    <PageShell>
      <div style={{ textAlign: "center", marginBottom: 36 }} className={styles.fadeUp1}>
        <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>SEASON PLANNER</span>
        <h1 style={{ margin: "14px 0 12px", font: "400 clamp(28px,6vw,58px)/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>Plan your planting.</h1>
        <p style={{ margin: 0, font: "400 16px/1.7 'Outfit'", color: "rgba(250,249,246,0.62)", maxWidth: 480 }}>
          Tell us your crop and district. We&apos;ll pick the best-fit variety and sowing window from the 16-day forecast.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 680 }} className={styles.fadeUp2}>
        {error && (
          <div style={{ background: "rgba(185,28,28,0.15)", border: "1px solid rgba(185,28,28,0.35)", borderRadius: 14, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ font: "600 14px 'Outfit'", color: "#FAF9F6", margin: "0 0 4px" }}>Planning failed</p>
              <p style={{ font: "400 13px 'Outfit'", color: "rgba(250,249,246,0.75)", margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formCard} style={{ background: "#F0E7D5", borderRadius: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.45)" }}>
          <div className={styles.formRow} style={{ marginBottom: 32 }}>
            <div>
              <label style={{ display: "block", font: "600 13px 'Outfit'", color: "#1e3a18", letterSpacing: "0.04em", marginBottom: 9 }}>
                CROP TYPE <span style={{ color: "#5a8a4a" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.crop_type}
                  onChange={(e) => setForm((f) => ({ ...f, crop_type: e.target.value as CropType }))}
                  className={styles.fieldInput}
                  style={{ color: form.crop_type ? "#1e3a18" : "rgba(30,58,24,0.4)" }}
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

            <div>
              <label style={{ display: "block", font: "600 13px 'Outfit'", color: "#1e3a18", letterSpacing: "0.04em", marginBottom: 9 }}>
                YOUR DISTRICT <span style={{ color: "#5a8a4a" }}>*</span>
              </label>
              <DistrictPicker value={form.region} onChange={(v) => setForm((f) => ({ ...f, region: v }))} />
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(49,87,44,0.12)", marginBottom: 28 }} />

          <button type="submit" disabled={!isValid} className={styles.submitBtn}>
            Get my planting plan
          </button>
          {!isValid && (
            <div style={{ textAlign: "center", font: "400 13px 'Outfit'", color: "rgba(30,58,24,0.4)", marginTop: 14 }}>
              Select a crop and district to continue
            </div>
          )}
        </form>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28, alignItems: "center" }}>
          <span style={{ font: "400 12px 'Outfit'", color: "rgba(144,169,85,0.5)" }}>Powered by</span>
          {["Gemini", "OpenMeteo"].map((name, i) => (
            <span key={name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ font: "500 12px 'Outfit'", color: "rgba(144,169,85,0.7)" }}>{name}</span>
              {i < 1 && <span style={{ font: "400 12px 'Outfit'", color: "rgba(144,169,85,0.3)" }}>·</span>}
            </span>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const router = useRouter();
  const { status, error, submit } = useAdvisor();
  const isLoading = status === "loading";

  const handleSubmit = async (query: AdvisorQuery) => {
    const result = await submit(query);
    if (result) {
      sessionStorage.setItem("govihitha_advice", JSON.stringify(result));
      await router.push("/advisor-results");
    }
  };

  if (isLoading) return <LoadingView />;

  return <AdvisorForm onSubmit={handleSubmit} error={status === "error" ? (error ?? "Something went wrong.") : null} />;
}

AdvisorPage.getLayout = (page: ReactElement) => page;
