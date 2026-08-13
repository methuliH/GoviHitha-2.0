import type { ReactElement } from "react";
import Link from "next/link";
import SharedNav from "@/components/layout/SharedNav";
import styles from "@/styles/home.module.css";

// ── Mock UI card (decorative, right side of hero) ────────────────────────────

function MockUICard() {
  return (
    <div className={`${styles.fadeIn} ${styles.heroMockCard}`}>
      {/* Main glass card */}
      <div
        className={styles.float}
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(49,87,44,0.14)",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 32px 80px rgba(30,58,24,0.12)",
        }}
      >
        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ font: "600 11px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.12em" }}>
            DISEASE SCAN
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(49,87,44,0.1)",
              borderRadius: 100,
              padding: "5px 11px",
            }}
          >
            <span
              className={styles.pulse}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#31572C", display: "inline-block" }}
            />
            <span style={{ font: "600 11px 'Outfit'", color: "#31572C" }}>Complete</span>
          </span>
        </div>

        {/* Crop image placeholder */}
        <div
          style={{
            height: 128,
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <img
            src="/potato-diseases.jpg"
            alt="crop photo"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>

        {/* Detection result */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#31572C", flexShrink: 0 }} />
            <span style={{ font: "600 15px 'Outfit'", color: "#1e3a18" }}>Leaf Blight Detected</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ font: "400 11px 'Outfit'", color: "#5a8a4a", whiteSpace: "nowrap" }}>Confidence</span>
            <div style={{ flex: 1, height: 5, background: "rgba(49,87,44,0.12)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: "94%", height: "100%", background: "linear-gradient(90deg, #40916C, #ECF39E)", borderRadius: 3 }} />
            </div>
            <span style={{ font: "700 12px 'Outfit'", color: "#31572C", whiteSpace: "nowrap" }}>94%</span>
          </div>
        </div>

        {/* Treatment steps */}
        <div style={{ background: "rgba(49,87,44,0.06)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ font: "600 10px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.1em", marginBottom: 9 }}>
            TREATMENT
          </div>
          {["Apply copper fungicide", "Remove infected leaves", "Improve air circulation"].map((step) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#5a8a4a", flexShrink: 0 }} />
              <span style={{ font: "400 12px 'Outfit'", color: "rgba(30,58,24,0.75)" }}>{step}</span>
            </div>
          ))}
        </div>

        {/* Weather alert */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(49,87,44,0.08)",
            border: "1px solid rgba(49,87,44,0.18)",
            borderRadius: 10,
            padding: "10px 13px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" overflow="visible">
            <path
              d="M3 11.5 Q3 7.5 6.5 7.5 Q6.5 4 9.5 4 Q13.5 4 13.5 8 Q15.5 8 15.5 11.5 Z"
              fill="none"
              stroke="#5a8a4a"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <line x1="6" y1="13.5" x2="5.5" y2="15.5" stroke="#31572C" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="9" y1="13.5" x2="8.5" y2="15.5" stroke="#31572C" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="12" y1="13.5" x2="11.5" y2="15.5" stroke="#31572C" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span style={{ font: "400 12px 'Outfit'", color: "#31572C" }}>High humidity risk this week</span>
        </div>
      </div>

      {/* Small product card below */}
      <div
        style={{
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(49,87,44,0.12)",
          borderRadius: 16,
          padding: "13px 16px",
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 13,
          boxShadow: "0 16px 40px rgba(30,58,24,0.1)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            background: "rgba(49,87,44,0.1)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2.5 6.5 L1.5 15.5 L16.5 15.5 L15.5 6.5 Z" fill="none" stroke="#31572C" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M6 6.5 Q6 3 9 3 Q12 3 12 6.5" fill="none" stroke="#31572C" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="6.5" cy="13" r="1.2" fill="#31572C" />
            <circle cx="11.5" cy="13" r="1.2" fill="#31572C" />
          </svg>
        </div>
        <div>
          <div style={{ font: "600 12px 'Outfit'", color: "#1e3a18" }}>Copper fungicide available</div>
          <div style={{ font: "400 11px 'Outfit'", color: "#5a8a4a", marginTop: 2 }}>Rs. 450 · View on Kapruka →</div>
        </div>
      </div>
    </div>
  );
}

// ── Feature cards ─────────────────────────────────────────────────────────────

const features = [
  {
    label: "Instant Disease Diagnosis",
    description: "Upload a photo of your crop. Gemini Vision identifies the disease, confidence level, and treatment steps.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" overflow="visible">
        <circle cx="10.5" cy="10.5" r="7" stroke="#ECF39E" strokeWidth="1.8" />
        <line x1="15.5" y1="15.5" x2="22.5" y2="22.5" stroke="#ECF39E" strokeWidth="2" strokeLinecap="round" />
        <line x1="10.5" y1="6.5" x2="10.5" y2="14.5" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6.5" y1="10.5" x2="14.5" y2="10.5" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Weather Risk Alerts",
    description: "Real-time forecasts from OpenMeteo, contextualised to your diagnosed disease and Sri Lankan district.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" overflow="visible">
        <path d="M4 18.5 Q4 13.5 8 13.5 Q8 8.5 13 8.5 Q19.5 8.5 19.5 14 Q22.5 14 22.5 18.5 Z" fill="none" stroke="#ECF39E" strokeWidth="1.8" strokeLinejoin="round" />
        <line x1="9" y1="21.5" x2="8.5" y2="24.5" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13.5" y1="21.5" x2="13" y2="24.5" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="21.5" x2="17.5" y2="24.5" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Local Product Links",
    description: "Recommended fungicides, tools, and seeds with estimated LKR costs and direct Kapruka shopping links.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" overflow="visible">
        <path d="M3.5 9.5 L2 22 L24 22 L22.5 9.5 Z" fill="none" stroke="#ECF39E" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 9.5 Q9 4 13 4 Q17 4 17 9.5" fill="none" stroke="#ECF39E" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="9.5" cy="18.5" r="1.8" fill="#ECF39E" />
        <circle cx="16.5" cy="18.5" r="1.8" fill="#ECF39E" />
      </svg>
    ),
  },
  {
    label: "Smart Planting Advisor",
    description: "Tell us your crop and district. We recommend a real, proven variety and the safest sowing window from the 16-day forecast.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" overflow="visible">
        <path d="M13 24V9M13 9C13 9 6 9 6 3C11.5 3 13 9 13 9ZM13 9C13 9 20 9 20 3C14.5 3 13 9 13 9Z" stroke="#ECF39E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Live Market Prices",
    description: "Check today's farm-gate price against the recent average in one tap — before you negotiate with a middleman.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" overflow="visible">
        <path d="M3 20L9 12L15 16L23 5" stroke="#ECF39E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// ── Crops data ────────────────────────────────────────────────────────────────

const cropsLeft = [
  { num: "01", name: "Rice", serif: true },
  { num: "02", name: "Tea", serif: false },
  { num: "03", name: "Coconut", serif: true },
  { num: "04", name: "Banana", serif: false },
  { num: "05", name: "Tomato", serif: true },
  { num: "06", name: "Chilli", serif: true, italic: true, color: "#31572C" },
];

const cropsRight = [
  { num: "07", name: "Corn", serif: false },
  { num: "08", name: "Cassava", serif: true },
  { num: "09", name: "Pepper", serif: false },
  { num: "10", name: "Potato", serif: true },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 20% 0%, #4a7c43 0%, #31572C 48%, #1e3a18 100%)",
        position: "relative",
        overflowX: "hidden",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Dot texture overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(144,169,85,0.13) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <SharedNav />

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          background: "#F0E7D5",
          borderRadius: 32,
          margin: "24px 24px 0",
          overflow: "hidden",
        }}
      >
        <div
          className={styles.heroInner}
          style={{ maxWidth: 1280, margin: "0 auto" }}
        >
          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: "0 0 26px" }}>
              <span
                className={styles.fadeUp1}
                style={{ display: "block", font: "400 clamp(32px,7vw,70px)/1.05 'Fraunces'", color: "#1e3a18", letterSpacing: "-0.025em" }}
              >
                Diagnose your crop.
              </span>
              <span
                className={styles.fadeUp2}
                style={{ display: "block", font: "400 clamp(32px,7vw,70px)/1.05 'Fraunces'", color: "#31572C", fontStyle: "italic", letterSpacing: "-0.025em" }}
              >
                Act before it&apos;s too late.
              </span>
            </h1>

            <p
              className={styles.fadeUp3}
              style={{ margin: "0 0 44px", font: "400 18px/1.75 'Outfit'", color: "rgba(30,58,24,0.6)", maxWidth: 500 }}
            >
              GoviHitha uses AI to identify crop diseases from a photo, warn you about incoming weather risks,
              and recommend products available in your district.
            </p>

            <div className={styles.fadeUp4} style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/diagnose">
                <button className={styles.ctaPrimary}>Start Diagnosis</button>
              </Link>
              <Link href="/advisor">
                <button className={styles.ctaSecondary}>Plan Your Planting</button>
              </Link>
              <Link href="/market">
                <button className={styles.ctaSecondary}>Check Market Prices</button>
              </Link>
              <Link href="/about">
                <button className={styles.ctaSecondary}>How it works</button>
              </Link>
            </div>
          </div>

          {/* Right: mock UI */}
          <MockUICard />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        className={styles.featureSection}
        style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.18em" }}>
              FEATURES
            </span>
            <h2 style={{ margin: "14px 0 0", font: "400 clamp(24px,5vw,44px)/1.1 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.02em" }}>
              What GoviHitha does for you
            </h2>
          </div>

          <div className={styles.featureGrid}>
            {features.map(({ label, description, icon }) => (
              <div key={label} className={styles.featureCard}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    background: "rgba(236,243,158,0.13)",
                    borderRadius: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  {icon}
                </div>
                <h3 style={{ margin: "0 0 12px", font: "600 19px 'Outfit'", color: "#ECF39E", letterSpacing: "-0.01em" }}>
                  {label}
                </h3>
                <p style={{ margin: 0, font: "400 15px/1.68 'Outfit'", color: "rgba(250,249,246,0.62)" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORTED CROPS ── */}
      <section
        className={styles.cropsSection}
        style={{
          position: "relative",
          zIndex: 1,
          background: "#F0E7D5",
          borderRadius: 32,
          margin: "0 24px",
        }}
      >
        {/* Giant watermark */}
        <div
          style={{
            position: "absolute",
            right: -20,
            top: "50%",
            transform: "translateY(-50%)",
            font: "700 clamp(80px,40vw,320px)/1 'Fraunces'",
            color: "rgba(49,87,44,0.05)",
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "-0.06em",
          }}
        >
          10
        </div>

        <div className={styles.cropsGrid} style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Left: heading */}
          <div style={{ paddingTop: 8 }}>
            <span style={{ font: "600 11px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.2em" }}>CROP INDEX</span>
            <h2 style={{ margin: "18px 0 24px", font: "400 clamp(28px,5vw,52px)/1.1 'Fraunces'", color: "#1e3a18", letterSpacing: "-0.02em" }}>
              10 crops.<br />
              <span style={{ color: "#31572C", fontStyle: "italic" }}>One platform.</span>
            </h2>
            <p style={{ margin: 0, font: "400 15px/1.7 'Outfit'", color: "rgba(30,58,24,0.55)", maxWidth: 340 }}>
              Every diagnosis, weather alert, and product recommendation is tailored to the specific crop you grow.
            </p>
          </div>

          {/* Right: crop list */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              {/* Col 1 */}
              <div>
                {cropsLeft.map(({ num, name, serif, italic, color }, i) => (
                  <div key={num} className={i === cropsLeft.length - 1 ? styles.cropRowLast : styles.cropRow}>
                    <span style={{ font: "400 11px 'Outfit'", color: "#90A955", letterSpacing: "0.1em", flexShrink: 0 }}>{num}</span>
                    <span
                      style={{
                        font: serif
                          ? `400 ${name === "Chilli" ? "24px/1.1" : "26px/1"} 'Fraunces'`
                          : "500 22px/1 'Outfit'",
                        color: color ?? "#1e3a18",
                        fontStyle: italic ? "italic" : "normal",
                      }}
                    >
                      {name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Col 2 */}
              <div>
                {cropsRight.map(({ num, name, serif }, i) => (
                  <div key={num} className={i === cropsRight.length - 1 ? styles.cropRowRightLast : styles.cropRowRight}>
                    <span style={{ font: "400 11px 'Outfit'", color: "#90A955", letterSpacing: "0.1em", flexShrink: 0 }}>{num}</span>
                    <span
                      style={{
                        font: serif ? "400 26px/1 'Fraunces'" : "500 22px/1 'Outfit'",
                        color: "#1e3a18",
                      }}
                    >
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid rgba(144,169,85,0.18)",
          padding: "30px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.22)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ font: "700 14px 'Outfit'", color: "#ECF39E" }}>GoviHitha</span>
          <span style={{ font: "400 14px 'Outfit'", color: "rgba(144,169,85,0.8)" }}>
            {" "}— AI-powered crop advisory for Sri Lankan farmers
          </span>
        </div>
        <div style={{ font: "400 13px 'Outfit'", color: "rgba(144,169,85,0.55)" }}>
          Powered by Gemini · OpenMeteo · Google ADK
        </div>
      </footer>
    </div>
  );
}

Home.getLayout = (page: ReactElement) => page;
