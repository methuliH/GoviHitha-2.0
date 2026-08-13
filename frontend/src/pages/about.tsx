import type { ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";
import SharedNav from "@/components/layout/SharedNav";
import styles from "@/styles/about.module.css";

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Is GoviHitha free to use?",
    a: "Yes. GoviHitha is completely free for Sri Lankan farmers. It uses the Gemini API and OpenMeteo, both of which have free tiers.",
  },
  {
    q: "Which crops are supported?",
    a: "Rice, Tea, Coconut, Banana, Corn, Cassava, Pepper, Chilli, Tomato, and Potato. More crops will be added soon.",
  },
  {
    q: "How accurate is the diagnosis?",
    a: "Accuracy depends on photo quality and lighting. Clear, close-up photos of affected leaves give the best results. Always consult a local agricultural officer for critical decisions.",
  },
  {
    q: "Do I need internet access?",
    a: "Yes. GoviHitha calls the Gemini Vision API and OpenMeteo weather service, both of which require an internet connection.",
  },
  {
    q: "Are Kapruka links guaranteed to have stock?",
    a: "No. Kapruka links are generated as search queries. Stock availability depends on Kapruka's sellers at the time of purchase.",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckBadge({ dark }: { dark?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      background: dark ? "rgba(236,243,158,0.1)" : "rgba(49,87,44,0.1)",
      border: dark ? "1px solid rgba(236,243,158,0.22)" : "none",
      borderRadius: "100px", padding: "7px 14px",
      font: "500 12px 'Outfit'",
      color: dark ? "#ECF39E" : "#31572C",
    }}>
      {dark ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#ECF39E" strokeWidth="1.4" />
          <path d="M4 6l1.5 1.5 3-3" stroke="#ECF39E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#31572C" strokeWidth="1.4" />
          <path d="M4 6l1.5 1.5 3-3" stroke="#31572C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function About() {
  const [open, setOpen] = useState<boolean[]>([false, false, false, false, false]);
  const toggle = (i: number) => setOpen((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflowX: "hidden", fontFamily: "'Outfit', sans-serif" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/about-bg.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(18,38,14,0.78)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 0%, rgba(74,124,67,0.4) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(144,169,85,0.1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>

      <SharedNav />

      {/* ── HERO ── */}
      <section className={styles.aboutHero} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <span className={styles.fadeUp0} style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>HOW IT WORKS</span>
        <h1
          className={styles.fadeUp1}
          style={{ margin: "18px auto 20px", font: "400 clamp(30px,6vw,64px)/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.03em", maxWidth: 700 }}
        >
          From photo to{" "}
          <span style={{ color: "#ECF39E", fontStyle: "italic" }}>action plan</span>
          <br />in seconds.
        </h1>
        <p
          className={styles.fadeUp2}
          style={{ margin: "0 auto", font: "400 17px/1.75 'Outfit'", color: "rgba(250,249,246,0.55)", maxWidth: 480 }}
        >
          Take a photo of your sick plant. GoviHitha tells you exactly what to do.
        </p>
      </section>

      {/* ── HOW IT WORKS — timeline ── */}
      <section className={styles.timelineSection} style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Vertical spine */}
          <div className={styles.timelineSpine} style={{ position: "absolute", left: 39, top: 40, bottom: 40, width: 2, background: "linear-gradient(to bottom, rgba(236,243,158,0.6) 0%, rgba(144,169,85,0.3) 100%)", zIndex: 0 }} />

          {/* Step 1 — camera icon, light card */}
          <div className={`${styles.fadeUp1} ${styles.stepRow}`} style={{ paddingBottom: 32, position: "relative" }}>
            <div className={styles.stepIconCol} style={{ position: "relative", zIndex: 1 }}>
              <div style={{ width: 56, height: 56, background: "#ECF39E", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(236,243,158,0.12)" }}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="7" width="20" height="16" rx="3" fill="none" stroke="#1e3a18" strokeWidth="1.8" />
                  <circle cx="14" cy="15" r="4" fill="none" stroke="#1e3a18" strokeWidth="1.6" />
                  <rect x="10" y="4" width="8" height="4" rx="2" fill="none" stroke="#1e3a18" strokeWidth="1.5" />
                  <circle cx="21" cy="10" r="2" fill="#1e3a18" />
                </svg>
              </div>
            </div>
            <div className={styles.stepCardLight}>
              <div style={{ position: "absolute", right: -8, top: -20, font: "700 120px/1 'Fraunces'", color: "rgba(49,87,44,0.05)", pointerEvents: "none", userSelect: "none" }}>01</div>
              <div style={{ font: "600 11px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 8 }}>STEP 1</div>
              <h3 style={{ margin: "0 0 10px", font: "400 clamp(20px,3vw,28px)/1.1 'Fraunces'", color: "#1e3a18", letterSpacing: "-0.02em" }}>Take a photo of your sick plant</h3>
              <p style={{ margin: "0 0 16px", font: "400 15px/1.7 'Outfit'", color: "rgba(30,58,24,0.65)" }}>Point your phone at the sick leaves or fruit. A clear, close-up photo works best.</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <CheckBadge dark={false} />
                <span style={{ font: "500 12px 'Outfit'", color: "#31572C" }}>Works on any smartphone</span>
              </span>
            </div>
          </div>

          {/* Step 2 — eye/AI icon, dark card */}
          <div className={`${styles.fadeUp2} ${styles.stepRow}`} style={{ paddingBottom: 32, position: "relative" }}>
            <div className={styles.stepIconCol} style={{ position: "relative", zIndex: 1 }}>
              <div style={{ width: 56, height: 56, background: "#31572C", border: "2px solid #ECF39E", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(49,87,44,0.25)" }}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="8" fill="none" stroke="#ECF39E" strokeWidth="1.7" />
                  <path d="M10 12 Q14 8 18 12 Q14 16 10 12Z" fill="rgba(236,243,158,0.2)" stroke="#ECF39E" strokeWidth="1.2" />
                  <circle cx="14" cy="14" r="2" fill="#ECF39E" />
                  <line x1="14" y1="6" x2="14" y2="4" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="20.5" y1="9" x2="22" y2="7.5" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="22" y1="14" x2="24" y2="14" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className={styles.stepCardDark}>
              <div style={{ position: "absolute", right: -8, top: -20, font: "700 120px/1 'Fraunces'", color: "rgba(236,243,158,0.05)", pointerEvents: "none", userSelect: "none" }}>02</div>
              <div style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.14em", marginBottom: 8 }}>STEP 2</div>
              <h3 style={{ margin: "0 0 10px", font: "400 clamp(20px,3vw,28px)/1.1 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.02em" }}>AI reads your photo</h3>
              <p style={{ margin: "0 0 16px", font: "400 15px/1.7 'Outfit'", color: "rgba(250,249,246,0.65)" }}>Google Gemini Vision scans the image and matches symptoms to known Sri Lankan crop diseases in seconds.</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(236,243,158,0.1)", border: "1px solid rgba(236,243,158,0.22)", borderRadius: "100px", padding: "7px 14px", font: "500 12px 'Outfit'", color: "#ECF39E" }}>
                <span className={styles.pulseDot} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ECF39E", display: "inline-block" }} />
                Powered by Gemini Vision
              </span>
            </div>
          </div>

          {/* Step 3 — cloud/rain icon, light card */}
          <div className={`${styles.fadeUp3} ${styles.stepRow}`} style={{ paddingBottom: 32, position: "relative" }}>
            <div className={styles.stepIconCol} style={{ position: "relative", zIndex: 1 }}>
              <div style={{ width: 56, height: 56, background: "#31572C", border: "2px solid rgba(236,243,158,0.5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(49,87,44,0.25)" }}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <path d="M5 20Q5 14 9 14Q9 8 13 8Q21 8 21 14.5Q24 14.5 24 20Z" fill="none" stroke="#ECF39E" strokeWidth="1.7" strokeLinejoin="round" />
                  <line x1="9" y1="23" x2="8" y2="27" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="14" y1="23" x2="13" y2="27" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="19" y1="23" x2="18" y2="27" stroke="#ECF39E" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className={styles.stepCardLight}>
              <div style={{ position: "absolute", right: -8, top: -20, font: "700 120px/1 'Fraunces'", color: "rgba(49,87,44,0.05)", pointerEvents: "none", userSelect: "none" }}>03</div>
              <div style={{ font: "600 11px 'Outfit'", color: "#5a8a4a", letterSpacing: "0.14em", marginBottom: 8 }}>STEP 3</div>
              <h3 style={{ margin: "0 0 10px", font: "400 clamp(20px,3vw,28px)/1.1 'Fraunces'", color: "#1e3a18", letterSpacing: "-0.02em" }}>Your local weather is checked</h3>
              <p style={{ margin: "0 0 16px", font: "400 15px/1.7 'Outfit'", color: "rgba(30,58,24,0.65)" }}>Live weather data for your district is fetched. GoviHitha checks if rain or heat will make the disease worse.</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <CheckBadge dark={false} />
                <span style={{ font: "500 12px 'Outfit'", color: "#31572C" }}>OpenMeteo live forecast</span>
              </span>
            </div>
          </div>

          {/* Step 4 — checklist icon, deep dark card */}
          <div className={`${styles.fadeUp4} ${styles.stepRow}`} style={{ position: "relative" }}>
            <div className={styles.stepIconCol} style={{ position: "relative", zIndex: 1 }}>
              <div style={{ width: 56, height: 56, background: "#ECF39E", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(236,243,158,0.15)" }}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <path d="M6 8h16M6 13h10M6 18h12" stroke="#1e3a18" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="22" cy="20" r="4" fill="#1e3a18" />
                  <path d="M20.5 20l1 1.2 2-2" stroke="#ECF39E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className={styles.stepCardDeep}>
              <div style={{ position: "absolute", right: -8, top: -20, font: "700 120px/1 'Fraunces'", color: "rgba(236,243,158,0.04)", pointerEvents: "none", userSelect: "none" }}>04</div>
              <div style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.14em", marginBottom: 8 }}>STEP 4</div>
              <h3 style={{ margin: "0 0 10px", font: "400 clamp(20px,3vw,28px)/1.1 'Fraunces'", color: "#ECF39E", letterSpacing: "-0.02em" }}>You get an action plan</h3>
              <p style={{ margin: "0 0 16px", font: "400 15px/1.7 'Outfit'", color: "rgba(250,249,246,0.65)" }}>A simple numbered plan: what to buy, where to buy it with LKR prices, and what to do before the next rainfall.</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <CheckBadge dark={true} />
                <span style={{ font: "500 12px 'Outfit'", color: "#ECF39E" }}>With Kapruka shopping links</span>
              </span>
            </div>
          </div>

        </div>

        {/* CTA strip */}
        <div className={`${styles.fadeUp5} ${styles.ctaStrip}`} style={{ marginTop: 24, background: "#ECF39E", borderRadius: 22 }}>
          <div>
            <div style={{ font: "400 clamp(20px,3vw,28px)/1.1 'Fraunces'", color: "#1e3a18", letterSpacing: "-0.02em" }}>Ready to try it on your crop?</div>
            <div style={{ font: "400 15px 'Outfit'", color: "rgba(30,58,24,0.6)", marginTop: 6 }}>Free for all Sri Lankan farmers. No account needed.</div>
          </div>
          <Link href="/diagnose" className={styles.ctaBtn}>Start Diagnosis →</Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection} style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>FAQ</span>
          <h2 style={{ margin: "16px 0 0", font: "400 clamp(24px,5vw,44px)/1.1 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.02em" }}>Got questions?</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 800, margin: "0 auto" }}>
          {FAQS.map((faq, i) => (
            <div key={i} className={open[i] ? styles.faqItemOpen : styles.faqItem} onClick={() => toggle(i)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.1em", flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ font: "500 16px 'Outfit'", color: "#FAF9F6" }}>{faq.q}</span>
                </div>
                <span style={{ fontSize: 18, color: "#ECF39E", transform: open[i] ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.25s", flexShrink: 0 }}>+</span>
              </div>
              {open[i] && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(236,243,158,0.12)", font: "400 15px/1.7 'Outfit'", color: "rgba(250,249,246,0.65)", paddingLeft: 30 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

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

About.getLayout = (page: ReactElement) => page;
