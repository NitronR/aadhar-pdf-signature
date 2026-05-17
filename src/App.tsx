import { useState, useRef, useCallback } from "react";
import {
  extractPDFSignature,
  verifySignature,
  addVerificationStamp,
  type VerifyResult,
} from "./pdfSignature";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignatureResult extends VerifyResult {
  byteRange: [number, number, number, number];
  fileName: string;
  fileSize: string;
  sigSize: number;
}

type Step = "upload" | "analyzing" | "result";

// ─── Script Loader ─────────────────────────────────────────────────────────────

const loadScript = (src: string): Promise<void> =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = Object.assign(document.createElement("script"), {
      src,
      onload: res,
      onerror: rej,
    });
    document.head.appendChild(s);
  });

// ─── UIDAI/Aadhaar Design Tokens ──────────────────────────────────────────────

const C = {
  blue:        "#0d6efd",
  blueHover:   "#0b5ed7",
  blueLight:   "#e7f1ff",
  blueBorder:  "#9ec5fe",
  green:       "#198754",
  greenLight:  "#d1e7dd",
  greenDark:   "#0a3622",
  greenBorder: "#a3cfbb",
  red:         "#dc3545",
  redLight:    "#f8d7da",
  redDark:     "#58151c",
  redBorder:   "#f1aeb5",
  text:        "#212529",
  muted:       "#6c757d",
  border:      "#dee2e6",
  borderLight: "#e9ecef",
  bg:          "#f8f9fa",
  white:       "#ffffff",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fa",
    fontFamily: "'Noto Sans', 'Segoe UI', Arial, sans-serif",
    color: C.text,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "stretch",
  },

  // ── Top nav bar ──────────────────────────────────────────────────────────────
  topBar: {
    background: C.blue,
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    flexShrink: 0,
  },
  topBarBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none" as const,
  },
  topBarLogoBox: {
    width: 36,
    height: 36,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  topBarName: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 17,
    lineHeight: 1.2,
  },
  topBarTagline: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    letterSpacing: 0.4,
    display: "block",
    marginTop: 1,
  },
  topBarBadge: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 4,
    padding: "4px 10px",
    color: "#ffffff",
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: 500,
  },

  // ── Main content ─────────────────────────────────────────────────────────────
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "36px 16px 64px",
  },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  hero: {
    textAlign: "center" as const,
    marginBottom: 28,
    maxWidth: 640,
    width: "100%",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: C.greenLight,
    border: `1px solid ${C.greenBorder}`,
    borderRadius: 20,
    padding: "5px 14px",
    fontSize: 12,
    color: C.greenDark,
    fontWeight: 600,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  h1: {
    fontSize: "clamp(20px, 4vw, 28px)",
    fontWeight: 700,
    color: C.text,
    margin: "0 0 8px",
    lineHeight: 1.3,
  },
  heroSub: {
    fontSize: 14,
    color: C.muted,
    margin: 0,
    lineHeight: 1.65,
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "28px 32px",
    width: "100%",
    maxWidth: 640,
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    marginBottom: 20,
  },

  // ── Dropzone ─────────────────────────────────────────────────────────────────
  dropzone: (active: boolean) => ({
    border: `2px dashed ${active ? C.blue : C.border}`,
    borderRadius: 8,
    padding: "44px 24px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.18s",
    background: active ? C.blueLight : C.bg,
  }),
  dzIcon: {
    fontSize: 40,
    marginBottom: 10,
    display: "block",
    filter: "grayscale(0.2)",
  },
  dzTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: C.text,
    marginBottom: 4,
  },
  dzSub: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 18,
    lineHeight: 1.5,
  },
  dzBtn: {
    display: "inline-block",
    padding: "10px 28px",
    background: C.blue,
    border: "none",
    borderRadius: 6,
    color: C.white,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.2,
    transition: "background 0.15s",
  },
  dzPrivacy: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
    fontSize: 12,
    color: C.muted,
    lineHeight: 1.5,
  },

  // ── Error ────────────────────────────────────────────────────────────────────
  errorBox: {
    background: C.redLight,
    border: `1px solid ${C.redBorder}`,
    borderRadius: 6,
    padding: "12px 16px",
    color: C.redDark,
    fontSize: 13,
    marginTop: 16,
    lineHeight: 1.65,
    whiteSpace: "pre-line" as const,
  },
  infoBox: {
    background: C.blueLight,
    border: `1px solid ${C.blueBorder}`,
    borderRadius: 6,
    padding: "10px 14px",
    color: "#084298",
    fontSize: 12,
    marginTop: 12,
  },

  // ── Analyzing ────────────────────────────────────────────────────────────────
  analyzing: {
    textAlign: "center" as const,
    padding: "52px 0",
  },
  spinner: {
    width: 44,
    height: 44,
    border: `3px solid ${C.borderLight}`,
    borderTop: `3px solid ${C.blue}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 18px",
  },
  progressText: {
    fontSize: 14,
    color: C.muted,
  },

  // ── Result ───────────────────────────────────────────────────────────────────
  resultHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottom: `1px solid ${C.border}`,
  },
  resultIcon: (ok: boolean) => ({
    flexShrink: 0,
    width: 54,
    height: 54,
    borderRadius: "50%",
    background: ok ? C.greenLight : C.redLight,
    border: `2px solid ${ok ? C.greenBorder : C.redBorder}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
  }),
  resultTitle: (ok: boolean) => ({
    fontSize: 20,
    fontWeight: 700,
    color: ok ? C.greenDark : C.redDark,
    margin: "0 0 4px",
  }),
  resultSub: {
    fontSize: 13,
    color: C.muted,
    margin: "0 0 8px",
    lineHeight: 1.5,
  },
  resultPill: (ok: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 12px",
    background: ok ? C.greenLight : C.redLight,
    color: ok ? C.greenDark : C.redDark,
    border: `1px solid ${ok ? C.greenBorder : C.redBorder}`,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
  }),

  // ── Buttons ──────────────────────────────────────────────────────────────────
  downloadBtn: {
    display: "block",
    width: "100%",
    padding: "13px",
    background: C.green,
    border: "none",
    borderRadius: 6,
    color: C.white,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    textDecoration: "none" as const,
    textAlign: "center" as const,
    transition: "background 0.15s",
    marginBottom: 10,
  },
  resetBtn: {
    display: "block",
    width: "100%",
    padding: "11px",
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    color: C.muted,
    fontSize: 14,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s",
    marginBottom: 24,
  },

  // ── Info Grid ────────────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    color: C.muted,
    marginBottom: 10,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
    marginBottom: 20,
  },
  infoCell: {
    background: C.bg,
    border: `1px solid ${C.borderLight}`,
    borderRadius: 6,
    padding: "10px 14px",
  },
  infoCellFull: {
    background: C.bg,
    border: `1px solid ${C.borderLight}`,
    borderRadius: 6,
    padding: "10px 14px",
    gridColumn: "1 / -1",
  },
  cellLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: C.muted,
    marginBottom: 4,
  },
  cellValue: {
    fontSize: 12,
    color: C.text,
    wordBreak: "break-all" as const,
    lineHeight: 1.5,
  },
  divider: {
    border: "none" as const,
    borderTop: `1px solid ${C.border}`,
    margin: "20px 0",
  },

  // ── Steps (how it works) ─────────────────────────────────────────────────────
  stepsRow: {
    maxWidth: 640,
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 20,
  },
  stepCard: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "16px 14px",
    textAlign: "center" as const,
  },
  stepNum: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    background: C.blueLight,
    border: `1px solid ${C.blueBorder}`,
    borderRadius: "50%",
    color: C.blue,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: C.text,
    marginBottom: 6,
  },
  stepBody: {
    fontSize: 11,
    color: C.muted,
    lineHeight: 1.6,
  },

  // ── SEO Content ──────────────────────────────────────────────────────────────
  seoWrap: {
    maxWidth: 640,
    width: "100%",
    marginTop: 40,
  },
  seoSection: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "24px 28px",
    marginBottom: 16,
  },
  seoH2: {
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
    margin: "0 0 12px",
    lineHeight: 1.35,
  },
  seoP: {
    fontSize: 13,
    color: C.muted,
    margin: "0 0 10px",
    lineHeight: 1.8,
  },
  seoUl: {
    paddingLeft: 20,
    margin: 0,
  },
  seoLi: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 6,
    lineHeight: 1.65,
  },
  faqItem: {
    borderBottom: `1px solid ${C.borderLight}`,
    paddingBottom: 14,
    marginBottom: 14,
  },
  faqQ: {
    cursor: "pointer",
    color: C.text,
    fontWeight: 600,
    fontSize: 13,
  },
  faqA: {
    fontSize: 13,
    color: C.muted,
    margin: "8px 0 0",
    lineHeight: 1.7,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    background: C.white,
    borderTop: `1px solid ${C.border}`,
    padding: "16px 24px",
    textAlign: "center" as const,
    fontSize: 12,
    color: C.muted,
    lineHeight: 1.8,
  },
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AadhaarVerifier() {
  const [libsReady, setLibsReady]   = useState(false);
  const [libsLoading, setLibsLoading] = useState(false);
  const [libError, setLibError]     = useState<string | null>(null);
  const [step, setStep]             = useState<Step>("upload");
  const [dragging, setDragging]     = useState(false);
  const [result, setResult]         = useState<SignatureResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [verifiedUrl, setVerifiedUrl] = useState<string | null>(null);
  const [progress, setProgress]     = useState("");
  const fileRef                     = useRef<HTMLInputElement>(null);
  const libsLoadingRef              = useRef(false);

  const loadLibs = useCallback(() => {
    if (libsReady || libsLoadingRef.current) return;
    libsLoadingRef.current = true;
    setLibsLoading(true);
    const FORGE  = "https://cdnjs.cloudflare.com/ajax/libs/forge/1.3.1/forge.min.js";
    const PDFLIB = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    Promise.all([loadScript(FORGE), loadScript(PDFLIB)])
      .then(() => { setLibsReady(true); setLibsLoading(false); })
      .catch(() => { setLibError("Failed to load cryptographic libraries. Check your internet connection."); setLibsLoading(false); });
  }, [libsReady]);

  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file?.name?.endsWith(".pdf") && file?.type !== "application/pdf") {
      setError("Please upload a PDF file (.pdf)");
      return;
    }
    if (!libsReady) {
      setError("Libraries are still loading — please wait a moment, then try again.");
      return;
    }

    setError(null);
    setResult(null);
    setVerifiedUrl(null);
    setStep("analyzing");

    try {
      setProgress("Reading PDF…");
      const buffer   = await file!.arrayBuffer();
      const pdfBytes = new Uint8Array(buffer);

      setProgress("Extracting digital signature…");
      const { signedData, sigBytes, byteRange } = extractPDFSignature(pdfBytes);

      setProgress("Verifying PKCS#7 signature…");
      const verifyResult = await verifySignature(signedData, sigBytes, window.forge);

      const res: SignatureResult = {
        ...verifyResult,
        fileName: file!.name,
        fileSize: (file!.size / 1024).toFixed(1) + " KB",
        byteRange,
        sigSize: sigBytes.length,
      };
      setResult(res);

      if (verifyResult.verified && window.PDFLib) {
        setProgress("Embedding verification stamp…");
        try {
          let tickPngBytes: Uint8Array | undefined;
          try {
            const r = await fetch("/tick.png");
            tickPngBytes = new Uint8Array(await r.arrayBuffer());
          } catch { /* use drawn fallback */ }
          const stamped = await addVerificationStamp(pdfBytes, verifyResult, window.PDFLib, tickPngBytes);
          const blob = new Blob([stamped as BlobPart], { type: "application/pdf" });
          setVerifiedUrl(URL.createObjectURL(blob));
        } catch {
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          setVerifiedUrl(URL.createObjectURL(blob));
        }
      }

      setStep("result");
    } catch (e) {
      setError((e as Error).message);
      setStep("upload");
    }
    setProgress("");
  }, [libsReady]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const reset = () => {
    setStep("upload");
    setResult(null);
    setError(null);
    setVerifiedUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        a:hover { opacity: 0.85; }
        button:hover { filter: brightness(0.93); }
        details summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* ── Top Navigation Bar ── */}
      <nav style={S.topBar}>
        <div style={S.topBarBrand}>
          <div style={S.topBarLogoBox}>🔐</div>
          <div>
            <span style={S.topBarName}>Aadhaar PDF Verifier</span>
            <span style={S.topBarTagline}>Aadhaar Digital Signature Tool</span>
          </div>
        </div>
        <div style={S.topBarBadge}>🔒 100% Private</div>
      </nav>

      {/* ── Main Content ── */}
      <main style={S.main}>

        {/* Hero */}
        <div style={S.hero}>
          <div style={S.heroBadge}>
            ✓ Free · No Adobe · Works on Mobile
          </div>
          <h1 style={S.h1}>Aadhaar Signature Verifier</h1>
          <p style={S.heroSub}>
            Generate a Signature Valid Aadhaar PDF with Green Tick — verify the UIDAI digital
            signature and download a stamped copy, instantly in your browser.
          </p>
        </div>

        {/* ── Tool Card ── */}
        <div style={S.card}>

          {/* STEP: UPLOAD */}
          {step === "upload" && (
            <div style={{ animation: "fadeUp 0.25s ease" }}>
              <div
                style={S.dropzone(dragging)}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); loadLibs(); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => { loadLibs(); fileRef.current?.click(); }}
              >
                <span style={S.dzIcon}>📄</span>
                <p style={S.dzTitle}>Drop your Aadhaar PDF here</p>
                <p style={S.dzSub}>
                  Drag &amp; drop or click to browse — processed entirely in your browser
                </p>
                <div style={S.dzBtn}>Browse PDF</div>
              </div>

              <div style={S.dzPrivacy}>
                🔒 Your file never leaves your device — 100% client-side processing
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => processFile(e.target.files?.[0])}
              />

              {(error || libError) && (
                <div style={S.errorBox}>{error || libError}</div>
              )}
              {libsLoading && !libsReady && !libError && (
                <div style={S.infoBox}>
                  ⏳ Loading cryptographic libraries…
                </div>
              )}
            </div>
          )}

          {/* STEP: ANALYZING */}
          {step === "analyzing" && (
            <div style={S.analyzing}>
              <div style={S.spinner} />
              <p style={S.progressText}>{progress || "Analyzing…"}</p>
            </div>
          )}

          {/* STEP: RESULT */}
          {step === "result" && result && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>

              {/* Status header */}
              <div style={S.resultHeader}>
                <div style={S.resultIcon(result.verified)}>
                  {result.verified ? "✓" : "✗"}
                </div>
                <div>
                  <p style={S.resultTitle(result.verified)}>
                    {result.verified ? "Signature Verified" : "Verification Failed"}
                  </p>
                  <p style={S.resultSub}>
                    {result.verified
                      ? result.hasUIDAI
                        ? "Valid UIDAI digital signature detected in this PDF"
                        : "Signature is cryptographically valid"
                      : "Could not verify the digital signature in this PDF"}
                  </p>
                  {result.hasUIDAI && (
                    <span style={S.resultPill(true)}>✓ UIDAI Certificate Detected</span>
                  )}
                </div>
              </div>

              {/* Action buttons — top */}
              {verifiedUrl && result.verified ? (
                <a
                  href={verifiedUrl}
                  download={result.fileName.replace(".pdf", "_verified.pdf")}
                  style={S.downloadBtn}
                >
                  ↓ Download Stamped PDF
                </a>
              ) : result.verified ? (
                <div style={{ ...S.errorBox, marginBottom: 12 }}>
                  Stamp could not be embedded — but the signature is verified.
                </div>
              ) : (
                <div style={{ ...S.errorBox, marginBottom: 12 }}>
                  Verification failed. The PDF may have been tampered with, or may not be a genuine
                  UIDAI Aadhaar document.
                </div>
              )}
              <button style={S.resetBtn} onClick={reset}>
                ← Verify Another PDF
              </button>

              {/* Signer Certificate */}
              <p style={S.sectionLabel}>Signer Certificate</p>
              <div style={S.infoGrid}>
                <div style={S.infoCellFull}>
                  <div style={S.cellLabel}>Issued By (Issuer)</div>
                  <div style={S.cellValue}>
                    {result.signerCertInfo.issuerO || result.signerCertInfo.issuerCN || "—"}
                    {result.signerCertInfo.issuerCN && result.signerCertInfo.issuerO
                      ? ` — ${result.signerCertInfo.issuerCN}`
                      : ""}
                  </div>
                </div>
                <div style={S.infoCellFull}>
                  <div style={S.cellLabel}>Subject (Certificate Holder)</div>
                  <div style={S.cellValue}>
                    {result.signerCertInfo.subjectCN || result.signerCertInfo.subjectO || "—"}
                  </div>
                </div>
                <div style={S.infoCell}>
                  <div style={S.cellLabel}>Valid From</div>
                  <div style={S.cellValue}>{fmt(result.signerCertInfo.validFrom)}</div>
                </div>
                <div style={S.infoCell}>
                  <div style={S.cellLabel}>Valid Until</div>
                  <div style={S.cellValue}>{fmt(result.signerCertInfo.validTo)}</div>
                </div>
                <div style={S.infoCellFull}>
                  <div style={S.cellLabel}>Certificate Serial Number</div>
                  <div style={S.cellValue}>
                    {result.signerCertInfo.serialNumber?.match(/.{1,8}/g)?.join(" ") || "—"}
                  </div>
                </div>
              </div>

              {/* Certificate Chain */}
              <p style={S.sectionLabel}>Certificate Chain</p>
              <div style={S.infoGrid}>
                <div style={S.infoCell}>
                  <div style={S.cellLabel}>Chain Depth</div>
                  <div style={S.cellValue}>
                    {result.certCount} certificate{result.certCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={S.infoCell}>
                  <div style={S.cellLabel}>Root CA</div>
                  <div style={S.cellValue}>
                    {result.rootCertInfo?.issuerO || result.rootCertInfo?.issuerCN || "—"}
                  </div>
                </div>
                <div style={S.infoCell}>
                  <div style={S.cellLabel}>UIDAI Certificate</div>
                  <div style={{
                    ...S.cellValue,
                    color: result.hasUIDAI ? C.green : C.red,
                    fontWeight: 600,
                  }}>
                    {result.hasUIDAI ? "✓ Detected" : "Not detected"}
                  </div>
                </div>
                <div style={S.infoCell}>
                  <div style={S.cellLabel}>Signature Size</div>
                  <div style={S.cellValue}>{(result.sigSize / 1024).toFixed(1)} KB</div>
                </div>
                <div style={S.infoCell}>
                  <div style={S.cellLabel}>Chain Valid</div>
                  <div style={{
                    ...S.cellValue,
                    color: result.chainVerified ? C.green : C.red,
                    fontWeight: 600,
                  }}>
                    {result.chainVerified ? "✓ Reaches CCA India Root" : "✗ Not trusted"}
                  </div>
                </div>
                <div style={S.infoCell}>
                  <div style={S.cellLabel}>PKCS#7 Signature</div>
                  <div style={{
                    ...S.cellValue,
                    color: result.signatureVerified ? C.green : C.red,
                    fontWeight: 600,
                  }}>
                    {result.signatureVerified ? "✓ Cryptographically valid" : "✗ Invalid"}
                  </div>
                </div>
              </div>

              {/* File Info */}
              <hr style={S.divider} />
              <p style={S.sectionLabel}>File Details</p>
              <div style={S.infoGrid}>
                <div style={S.infoCellFull}>
                  <div style={S.cellLabel}>File</div>
                  <div style={S.cellValue}>{result.fileName} ({result.fileSize})</div>
                </div>
                <div style={S.infoCellFull}>
                  <div style={S.cellLabel}>Signed Byte Ranges</div>
                  <div style={S.cellValue}>[{result.byteRange.join(", ")}]</div>
                </div>
              </div>

              <hr style={S.divider} />
            </div>
          )}
        </div>

        {/* ── How it works (3 steps) ── */}
        <div style={S.stepsRow}>
          {[
            { n: "1", title: "Extract", body: "Locates ByteRange & PKCS#7 Contents field embedded in the PDF by UIDAI" },
            { n: "2", title: "Verify",  body: "Parses the certificate chain and validates the cryptographic signature" },
            { n: "3", title: "Stamp",   body: "Appends a visual 'Signature Valid' stamp without breaking the original signature" },
          ].map((item) => (
            <div key={item.n} style={S.stepCard}>
              <div style={S.stepNum}>{item.n}</div>
              <div style={S.stepTitle}>{item.title}</div>
              <div style={S.stepBody}>{item.body}</div>
            </div>
          ))}
        </div>

        {/* ── SEO Content Sections ── */}
        <div style={S.seoWrap}>

          <div style={S.seoSection}>
            <h2 style={S.seoH2}>Why does my Aadhaar PDF show "Signature Not Verified"?</h2>
            <p style={S.seoP}>
              Every e-Aadhaar downloaded from UIDAI's portal is digitally signed using a certificate
              issued under India's Controller of Certifying Authorities (CCA) PKI. However, Adobe Reader,
              Chrome, and mobile PDF viewers do not have CCA India's root certificate in their trust store
              by default — so the signature appears as "Validity Unknown" even though it is cryptographically valid.
            </p>
            <p style={{ ...S.seoP, marginBottom: 0 }}>
              This is not a problem with your Aadhaar. Government offices and banks that ask for a
              "signature verified" Aadhaar require you to bridge this gap — traditionally only possible
              with Adobe Acrobat on desktop.
            </p>
          </div>

          <div style={S.seoSection}>
            <h2 style={S.seoH2}>How to generate a Signature Valid Aadhaar PDF with green tick</h2>
            <p style={S.seoP}>
              This tool runs entirely in your browser. When you upload your Aadhaar PDF, it extracts the
              PKCS#7 digital signature embedded by UIDAI, parses the certificate chain (leaf → UIDAI CA
              → CCA India root), and verifies each link cryptographically using the forge.js library.
              It then embeds a "Signature Valid" stamp into your PDF using pdf-lib.
            </p>
            <p style={{ ...S.seoP, marginBottom: 0 }}>
              Your Aadhaar PDF never leaves your device. You can verify this by disconnecting from the
              internet after the page loads — the tool will still work.
            </p>
          </div>

          <div style={S.seoSection}>
            <h2 style={S.seoH2}>Where is a verified Aadhaar required?</h2>
            <ul style={S.seoUl}>
              {[
                "Passport Seva Kendra applications requiring Aadhaar as address proof",
                "Bank account KYC with e-Aadhaar submission",
                "Government scheme enrollment portals",
                "Employment verification processes",
                "Any office asking for a \"digitally signed\" or \"signature verified\" Aadhaar printout",
              ].map((item) => (
                <li key={item} style={S.seoLi}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={S.seoSection}>
            <h2 style={S.seoH2}>Frequently Asked Questions</h2>
            {[
              {
                q: "How do I get the green tick on my Aadhaar PDF without Adobe Acrobat?",
                a: "Upload your Aadhaar PDF to this free tool. It verifies the UIDAI cryptographic signature in your browser and generates a downloadable PDF with a 'Signature Valid' stamp. No Adobe required, works on mobile, and your file never leaves your device.",
              },
              {
                q: "Is it safe to use my Aadhaar PDF with this tool?",
                a: "This tool processes your Aadhaar PDF entirely inside your browser using JavaScript. Your file is never uploaded to any server. You can verify this by turning off your internet after uploading — the tool will still work.",
              },
              {
                q: "Will passport offices and banks accept this verified Aadhaar PDF?",
                a: "The tool adds a visible verification stamp showing the UIDAI certificate details, issuing authority, and verification timestamp. The original UIDAI digital signature remains intact in the PDF.",
              },
              {
                q: "Does this work on mobile phones?",
                a: "Yes. This tool works on all modern mobile browsers (Android and iOS). No app download required.",
              },
              {
                q: "Why does the Aadhaar PDF show a yellow question mark instead of a green tick?",
                a: "The yellow question mark means 'Validity Unknown' — Adobe Reader cannot verify the UIDAI certificate chain because CCA India's root certificate is not in its default trust store. This tool adds the green tick by cryptographically verifying the signature and embedding a permanent stamp.",
              },
            ].map(({ q, a }) => (
              <details key={q} style={S.faqItem}>
                <summary style={S.faqQ}>{q}</summary>
                <p style={S.faqA}>{a}</p>
              </details>
            ))}
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={S.footer}>
        100% client-side · No data leaves your browser · Free to use<br />
        <a href="/hi/" style={{ color: C.blue, textDecoration: "none", fontSize: 11 }}>
          हिंदी में देखें →
        </a>
        {" · "}
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdtsrlXxjqUQdVkMXFPEZ1bPqVsehhUKdHZOf-sFgQPoBCKDw/viewform"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C.blue, textDecoration: "none", fontSize: 11 }}
        >
          Give Feedback →
        </a>
      </footer>
    </div>
  );
}
