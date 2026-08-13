import type { ReactElement } from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import type { AgentQuery } from "@/lib/types";
import { useAgent } from "@/hooks/useAgent";
import { CROP_TYPES, PROVINCES, type CropType, type Region } from "@/lib/constants";
import { fileToBase64, formatBytes } from "@/lib/image";
import SharedNav from "@/components/layout/SharedNav";
import styles from "@/styles/diagnose.module.css";

// ── District picker ───────────────────────────────────────────────────────────

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

// ── Image upload zone ─────────────────────────────────────────────────────────

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function ImageUploadZone({
  onImageReady,
  onClear,
}: {
  onImageReady: (base64: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      if (!ACCEPTED.includes(file.type)) { setError("Please upload a JPEG, PNG, or WebP image."); return; }
      if (file.size > MAX_BYTES) { setError("Image must be under 10 MB."); return; }
      setProcessing(true);
      try {
        const base64 = await fileToBase64(file);
        setPreview(URL.createObjectURL(file));
        setFileName(file.name);
        setFileSize(file.size);
        onImageReady(base64);
      } catch {
        setError("Failed to process image. Please try another file.");
      } finally {
        setProcessing(false);
      }
    },
    [onImageReady]
  );

  const handleFile = (files: FileList | null) => { if (files?.[0]) processFile(files[0]); };

  const handleClear = () => {
    setPreview(null); setFileName(""); setFileSize(0); setError("");
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  };

  if (preview) {
    return (
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid rgba(49,87,44,0.22)", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Crop preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
        <div style={{
          position: "absolute", inset: "auto 0 0 0",
          background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
          padding: "12px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        }}>
          <div style={{ color: "#fff" }}>
            <div style={{ font: "500 13px 'Outfit'", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</div>
            <div style={{ font: "400 11px 'Outfit'", color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{formatBytes(fileSize)}</div>
          </div>
          <button
            type="button" onClick={handleClear}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`${styles.uploadZone} ${dragging ? styles.uploadZoneDragging : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} style={{ display: "none" }} onChange={(e) => handleFile(e.target.files)} />

        {processing ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#31572C" }}>
            <svg style={{ animation: "spin 1s linear infinite", width: 32, height: 32 }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(49,87,44,0.2)" strokeWidth="4" />
              <path fill="#31572C" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span style={{ font: "500 14px 'Outfit'", color: "#1e3a18" }}>Processing…</span>
          </div>
        ) : (
          <>
            <div style={{ width: 56, height: 56, background: "rgba(49,87,44,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" overflow="visible">
                <rect x="2" y="16" width="22" height="8" rx="3" fill="none" stroke="#31572C" strokeWidth="1.6" />
                <path d="M13 14 L13 4" stroke="#31572C" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M9 8 L13 4 L17 8" stroke="#31572C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="20" cy="20" r="1.5" fill="#31572C" />
              </svg>
            </div>
            <div style={{ font: "500 15px 'Outfit'", color: "#1e3a18" }}>Drop your crop photo here</div>
            <div style={{ font: "400 14px 'Outfit'", color: "#5a8a4a" }}>
              or <span style={{ textDecoration: "underline", cursor: "pointer" }}>browse files</span>
            </div>
            <div style={{ font: "400 12px 'Outfit'", color: "rgba(30,58,24,0.4)", marginTop: 2 }}>JPEG, PNG, WebP · max 10 MB</div>
          </>
        )}
      </div>
      {error && (
        <p style={{ font: "400 13px 'Outfit'", color: "#b91c1c", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Page layout shell ─────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 0%, #4a7c43 0%, #31572C 48%, #1e3a18 100%)", position: "relative", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
      {/* Dot texture */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle, rgba(144,169,85,0.13) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 0 }} />
      <SharedNav />
      <main style={{ position: "relative", zIndex: 1, flex: 1 }}>
        {/* Background photo */}
        <div style={{ position: "fixed", inset: "64px 0 0 0", zIndex: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/farmland-bg.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(20,44,16,0.62)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(74,124,67,0.35) 0%, transparent 70%)" }} />
        </div>
        {/* Content */}
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
        <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>DISEASE SCAN</span>
        <h1 style={{ margin: "14px 0 12px", font: "400 58px/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>Diagnosing…</h1>
      </div>
      <div style={{ width: "100%", maxWidth: 680 }} className={styles.fadeUp2}>
        <div style={{ background: "#F0E7D5", borderRadius: 28, padding: "44px 48px", boxShadow: "0 32px 80px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", border: "4px solid rgba(49,87,44,0.15)", borderTop: "4px solid #31572C", animation: "spin 1s linear infinite" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", font: "24px serif" }}>🌿</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ font: "600 18px 'Outfit'", color: "#1e3a18", margin: "0 0 6px" }}>Consulting the AI agents…</p>
            <p style={{ font: "400 14px 'Outfit'", color: "rgba(30,58,24,0.55)", margin: 0 }}>This usually takes 10–20 seconds</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {["🔬 Analysing crop image", "🌦️ Checking weather risks", "🛒 Finding local products"].map((step) => (
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
  symptoms: string;
  region: Region | "";
  image_base64: string;
}

const EMPTY: FormState = { crop_type: "", symptoms: "", region: "", image_base64: "" };

function DiagnoseForm({ onSubmit, error }: { onSubmit: (q: AgentQuery) => void; error: string | null }) {
  const [form, setForm] = useState<FormState>(EMPTY);

  const remaining = Math.max(0, 10 - form.symptoms.trim().length);
  const isValid = form.crop_type !== "" && form.symptoms.trim().length >= 10 && form.region !== "" && form.image_base64 !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ crop_type: form.crop_type as CropType, symptoms: form.symptoms.trim(), region: form.region as Region, image_base64: form.image_base64 });
  };

  return (
    <PageShell>
      {/* Page header */}
      <div style={{ textAlign: "center", marginBottom: 36 }} className={styles.fadeUp1}>
        <span style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.2em" }}>DISEASE SCAN</span>
        <h1 style={{ margin: "14px 0 12px", font: "400 clamp(28px,6vw,58px)/1.05 'Fraunces'", color: "#FAF9F6", letterSpacing: "-0.025em" }}>Diagnose your crop.</h1>
        <p style={{ margin: 0, font: "400 16px/1.7 'Outfit'", color: "rgba(250,249,246,0.62)", maxWidth: 480 }}>
          Upload a clear photo of the affected plant and describe what you see. Our AI will identify the disease and recommend action.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 680 }} className={styles.fadeUp2}>
        {/* Error */}
        {error && (
          <div style={{ background: "rgba(185,28,28,0.15)", border: "1px solid rgba(185,28,28,0.35)", borderRadius: 14, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ font: "600 14px 'Outfit'", color: "#FAF9F6", margin: "0 0 4px" }}>Diagnosis failed</p>
              <p style={{ font: "400 13px 'Outfit'", color: "rgba(250,249,246,0.75)", margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        {/* Form card */}
        <form onSubmit={handleSubmit} className={styles.formCard} style={{ background: "#F0E7D5", borderRadius: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.45)" }}>

          {/* Row 1: crop + district */}
          <div className={styles.formRow}>
            {/* Crop type */}
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

            {/* District */}
            <div>
              <label style={{ display: "block", font: "600 13px 'Outfit'", color: "#1e3a18", letterSpacing: "0.04em", marginBottom: 9 }}>
                YOUR DISTRICT <span style={{ color: "#5a8a4a" }}>*</span>
              </label>
              <DistrictPicker value={form.region} onChange={(v) => setForm((f) => ({ ...f, region: v }))} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", font: "600 13px 'Outfit'", color: "#1e3a18", letterSpacing: "0.04em", marginBottom: 9 }}>
              DESCRIBE WHAT YOU SEE <span style={{ color: "#5a8a4a" }}>*</span>
            </label>
            <textarea
              rows={4}
              value={form.symptoms}
              onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
              placeholder="e.g. Yellowing leaves with brown spots on the edges, spreading inward from older leaves…"
              className={styles.fieldTextarea}
            />
            <div style={{ font: "400 12px 'Outfit'", color: "rgba(30,58,24,0.45)", marginTop: 6 }}>
              {remaining > 0 ? `At least ${remaining} more character${remaining === 1 ? "" : "s"} needed` : `${form.symptoms.trim().length} characters`}
            </div>
          </div>

          {/* Photo upload */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: "block", font: "600 13px 'Outfit'", color: "#1e3a18", letterSpacing: "0.04em", marginBottom: 9 }}>
              PHOTO OF AFFECTED CROP <span style={{ color: "#5a8a4a" }}>*</span>
            </label>
            <ImageUploadZone
              onImageReady={(base64) => setForm((f) => ({ ...f, image_base64: base64 }))}
              onClear={() => setForm((f) => ({ ...f, image_base64: "" }))}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(49,87,44,0.12)", marginBottom: 28 }} />

          {/* Submit */}
          <button type="submit" disabled={!isValid} className={styles.submitBtn}>
            Diagnose my crop
          </button>
          {!isValid && (
            <div style={{ textAlign: "center", font: "400 13px 'Outfit'", color: "rgba(30,58,24,0.4)", marginTop: 14 }}>
              Fill in all fields and upload a photo to continue
            </div>
          )}
        </form>

        {/* Powered by */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28, alignItems: "center" }}>
          <span style={{ font: "400 12px 'Outfit'", color: "rgba(144,169,85,0.5)" }}>Powered by</span>
          {["Gemini", "OpenMeteo", "Google ADK"].map((name, i) => (
            <span key={name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ font: "500 12px 'Outfit'", color: "rgba(144,169,85,0.7)" }}>{name}</span>
              {i < 2 && <span style={{ font: "400 12px 'Outfit'", color: "rgba(144,169,85,0.3)" }}>·</span>}
            </span>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────

export default function DiagnosePage() {
  const router = useRouter();
  const { status, error, submit } = useAgent();
  const isLoading = status === "loading";

  const handleSubmit = async (query: AgentQuery) => {
    const result = await submit(query);
    if (result) {
      sessionStorage.setItem("govihitha_result", JSON.stringify(result));
      await router.push("/results");
    }
  };

  if (isLoading) return <LoadingView />;

  return <DiagnoseForm onSubmit={handleSubmit} error={status === "error" ? (error ?? "Something went wrong.") : null} />;
}

DiagnosePage.getLayout = (page: ReactElement) => page;
