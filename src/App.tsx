import { useState, useEffect, useRef, useCallback } from "react";
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #060d19 0%, #0b1628 50%, #071020 100%)",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    color: "#c8d8e8",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "32px 16px 60px",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: 40,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,180,0,0.08)",
    border: "1px solid rgba(255,180,0,0.25)",
    borderRadius: 4,
    padding: "4px 12px",
    fontSize: 11,
    color: "#f0b400",
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: "uppercase" as const,
  },
  title: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "clamp(22px, 5vw, 34px)",
    fontWeight: 700,
    color: "#e8f0fa",
    letterSpacing: -0.5,
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: 13,
    color: "#5a7a9a",
    letterSpacing: 0.5,
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 32,
    width: "100%",
    maxWidth: 640,
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  },
  dropzone: (active: boolean) => ({
    border: `2px dashed ${active ? "#f0b400" : "rgba(255,255,255,0.12)"}`,
    borderRadius: 10,
    padding: "48px 24px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.2s",
    background: active ? "rgba(240,180,0,0.04)" : "transparent",
  }),
  uploadIcon: {
    fontSize: 48,
    marginBottom: 16,
    display: "block",
    opacity: 0.6,
  },
  uploadText: {
    fontSize: 15,
    color: "#8aabb0",
    marginBottom: 8,
  },
  uploadSub: {
    fontSize: 12,
    color: "#3a5a6a",
  },
  browseBtn: {
    display: "inline-block",
    marginTop: 20,
    padding: "10px 28px",
    background: "rgba(240,180,0,0.1)",
    border: "1px solid rgba(240,180,0,0.3)",
    borderRadius: 6,
    color: "#f0b400",
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    transition: "all 0.2s",
  },
  errorBox: {
    background: "rgba(220,50,50,0.08)",
    border: "1px solid rgba(220,80,80,0.25)",
    borderRadius: 8,
    padding: "14px 18px",
    color: "#ff7a7a",
    fontSize: 13,
    marginTop: 20,
    whiteSpace: "pre-line" as const,
    lineHeight: 1.6,
  },
  analyzing: {
    textAlign: "center" as const,
    padding: "48px 0",
  },
  spinner: {
    width: 48,
    height: 48,
    border: "3px solid rgba(255,255,255,0.06)",
    borderTop: "3px solid #f0b400",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  progressText: {
    fontSize: 13,
    color: "#5a8aaa",
    letterSpacing: 0.5,
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  statusBadge: (ok: boolean) => ({
    flexShrink: 0,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: ok ? "rgba(30,200,90,0.12)" : "rgba(220,50,50,0.12)",
    border: `2px solid ${ok ? "#1ec85a" : "#dc3c3c"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
  }),
  statusTitle: (ok: boolean) => ({
    fontFamily: "'Georgia', serif",
    fontSize: 20,
    fontWeight: 700,
    color: ok ? "#3de878" : "#ff6b6b",
    marginBottom: 4,
  }),
  statusSub: {
    fontSize: 12,
    color: "#4a6a7a",
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: "#3a6080",
    marginBottom: 12,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 20,
  },
  infoCell: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 6,
    padding: "10px 12px",
  },
  infoCellFull: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 6,
    padding: "10px 12px",
    gridColumn: "1 / -1",
  },
  cellLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    color: "#3a5a70",
    marginBottom: 4,
  },
  cellValue: {
    fontSize: 12,
    color: "#9ab8cc",
    wordBreak: "break-all" as const,
  },
  divider: {
    border: "none" as const,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    margin: "20px 0",
  },
  downloadBtn: {
    display: "block",
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #1a6e35 0%, #0f4a24 100%)",
    border: "1px solid rgba(50,200,100,0.3)",
    borderRadius: 8,
    color: "#4de890",
    fontSize: 14,
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    cursor: "pointer",
    textDecoration: "none" as const,
    textAlign: "center" as const,
    transition: "all 0.2s",
    marginBottom: 12,
  },
  resetBtn: {
    display: "block",
    width: "100%",
    padding: "11px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    color: "#4a6a80",
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: 1,
    cursor: "pointer",
    textTransform: "uppercase" as const,
    marginBottom: 20,
  },
  footer: {
    marginTop: 48,
    textAlign: "center" as const,
    fontSize: 11,
    color: "#1e3a4a",
    lineHeight: 1.8,
  },
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AadhaarVerifier() {
  const [libsReady, setLibsReady] = useState(false);
  const [libError, setLibError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<SignatureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifiedUrl, setVerifiedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const FORGE = "https://cdnjs.cloudflare.com/ajax/libs/forge/1.3.1/forge.min.js";
    const PDFLIB = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    Promise.all([loadScript(FORGE), loadScript(PDFLIB)])
      .then(() => setLibsReady(true))
      .catch(() => setLibError("Failed to load cryptographic libraries. Check your internet connection."));
  }, []);

  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file?.name?.endsWith(".pdf") && file?.type !== "application/pdf") {
      setError("Please upload a PDF file (.pdf)");
      return;
    }
    if (!libsReady) {
      setError("Libraries loading, please wait a moment…");
      return;
    }

    setError(null);
    setResult(null);
    setVerifiedUrl(null);
    setStep("analyzing");

    try {
      setProgress("Reading PDF…");
      const buffer = await file!.arrayBuffer();
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
            const res = await fetch('/tick.png');
            tickPngBytes = new Uint8Array(await res.arrayBuffer());
          } catch { /* use drawn fallback if fetch fails */ }
          const stamped = await addVerificationStamp(pdfBytes, verifyResult, window.PDFLib, tickPngBytes);
          const blob = new Blob([stamped as BlobPart], { type: "application/pdf" });
          setVerifiedUrl(URL.createObjectURL(blob));
        } catch (_e) {
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
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        * { box-sizing: border-box; }
        a:hover { opacity: 0.85; }
        button:hover { filter: brightness(1.15); }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.badge}>
          <span>🔐</span> Cryptographic Verification
        </div>
        <h1 style={styles.title}>Aadhaar PDF Verifier</h1>
        <p style={styles.subtitle}>
          Verify UIDAI digital signatures • Generate stamped PDF
        </p>
      </header>

      {/* Main Card */}
      <div style={styles.card}>
        {/* STEP: UPLOAD */}
        {step === "upload" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div
              style={styles.dropzone(dragging)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <span style={styles.uploadIcon}>📄</span>
              <p style={styles.uploadText}>Drop your Aadhaar PDF here</p>
              <p style={styles.uploadSub}>or click to browse — processed entirely in your browser</p>
              <div style={styles.browseBtn}>Browse PDF</div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => processFile(e.target.files?.[0])}
            />
            {(error || libError) && <div style={styles.errorBox}>{error || libError}</div>}
            {!libsReady && !libError && (
              <p style={{ ...styles.progressText, textAlign: "center", marginTop: 16 }}>
                ⏳ Loading cryptographic libraries…
              </p>
            )}
          </div>
        )}

        {/* STEP: ANALYZING */}
        {step === "analyzing" && (
          <div style={styles.analyzing}>
            <div style={styles.spinner} />
            <p style={styles.progressText}>{progress || "Analyzing…"}</p>
          </div>
        )}

        {/* STEP: RESULT */}
        {step === "result" && result && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Status Header */}
            <div style={styles.resultHeader}>
              <div style={styles.statusBadge(result.verified)}>
                {result.verified ? "✓" : "✗"}
              </div>
              <div>
                <div style={styles.statusTitle(result.verified)}>
                  {result.verified ? "Signature Verified" : "Verification Failed"}
                </div>
                <div style={styles.statusSub}>
                  {result.verified
                    ? result.hasUIDAI
                      ? "Valid UIDAI digital signature detected"
                      : "Signature is cryptographically valid"
                    : "Could not verify the digital signature"}
                </div>
              </div>
            </div>

            {/* Actions — top */}
            {verifiedUrl && result.verified ? (
              <a
                href={verifiedUrl}
                download={result.fileName.replace(".pdf", "_verified.pdf")}
                style={styles.downloadBtn}
              >
                ↓ Download Stamped PDF
              </a>
            ) : result.verified ? (
              <div style={{ ...styles.errorBox, marginBottom: 12 }}>
                Stamp could not be embedded — but the signature is verified.
              </div>
            ) : (
              <div style={{ ...styles.errorBox, marginBottom: 12 }}>
                Verification failed. The PDF may have been tampered with, or may not be a genuine UIDAI Aadhaar document.
              </div>
            )}
            <button style={styles.resetBtn} onClick={reset}>
              ← Verify Another PDF
            </button>

            {/* Signer Certificate */}
            <p style={styles.sectionLabel}>Signer Certificate</p>
            <div style={styles.infoGrid}>
              <div style={styles.infoCellFull}>
                <div style={styles.cellLabel}>Issued By (Issuer)</div>
                <div style={styles.cellValue}>
                  {result.signerCertInfo.issuerO || result.signerCertInfo.issuerCN || "—"}
                  {result.signerCertInfo.issuerCN && result.signerCertInfo.issuerO
                    ? ` — ${result.signerCertInfo.issuerCN}`
                    : ""}
                </div>
              </div>
              <div style={styles.infoCellFull}>
                <div style={styles.cellLabel}>Subject (Certificate Holder)</div>
                <div style={styles.cellValue}>
                  {result.signerCertInfo.subjectCN || result.signerCertInfo.subjectO || "—"}
                </div>
              </div>
              <div style={styles.infoCell}>
                <div style={styles.cellLabel}>Valid From</div>
                <div style={styles.cellValue}>{fmt(result.signerCertInfo.validFrom)}</div>
              </div>
              <div style={styles.infoCell}>
                <div style={styles.cellLabel}>Valid Until</div>
                <div style={styles.cellValue}>{fmt(result.signerCertInfo.validTo)}</div>
              </div>
              <div style={styles.infoCellFull}>
                <div style={styles.cellLabel}>Certificate Serial Number</div>
                <div style={styles.cellValue}>
                  {result.signerCertInfo.serialNumber?.match(/.{1,8}/g)?.join(" ") || "—"}
                </div>
              </div>
            </div>

            {/* Chain Info */}
            <p style={styles.sectionLabel}>Certificate Chain</p>
            <div style={styles.infoGrid}>
              <div style={styles.infoCell}>
                <div style={styles.cellLabel}>Chain Depth</div>
                <div style={styles.cellValue}>
                  {result.certCount} certificate{result.certCount !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={styles.infoCell}>
                <div style={styles.cellLabel}>Root CA</div>
                <div style={styles.cellValue}>
                  {result.rootCertInfo?.issuerO || result.rootCertInfo?.issuerCN || "—"}
                </div>
              </div>
              <div style={styles.infoCell}>
                <div style={styles.cellLabel}>UIDAI Certificate</div>
                <div style={{ ...styles.cellValue, color: result.hasUIDAI ? "#3de878" : "#ff9a6b" }}>
                  {result.hasUIDAI ? "✓ Detected" : "Not detected"}
                </div>
              </div>
              <div style={styles.infoCell}>
                <div style={styles.cellLabel}>Signature Size</div>
                <div style={styles.cellValue}>{(result.sigSize / 1024).toFixed(1)} KB</div>
              </div>
            </div>

            {/* File Info */}
            <hr style={styles.divider} />
            <p style={styles.sectionLabel}>File Details</p>
            <div style={styles.infoGrid}>
              <div style={styles.infoCellFull}>
                <div style={styles.cellLabel}>File</div>
                <div style={styles.cellValue}>{result.fileName} ({result.fileSize})</div>
              </div>
              <div style={styles.infoCellFull}>
                <div style={styles.cellLabel}>Signed Byte Ranges</div>
                <div style={styles.cellValue}>[{result.byteRange.join(", ")}]</div>
              </div>
            </div>

            <hr style={styles.divider} />
          </div>
        )}
      </div>

      {/* How it Works */}
      <div
        style={{
          maxWidth: 640,
          width: "100%",
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {[
          {
            icon: "🔍",
            title: "Extract",
            body: "Locates the ByteRange & PKCS#7 Contents field embedded in the PDF by UIDAI",
          },
          {
            icon: "🔐",
            title: "Verify",
            body: "Parses the certificate chain and validates the cryptographic signature with forge.js",
          },
          {
            icon: "📄",
            title: "Stamp",
            body: "Appends a visual verification stamp to the PDF using pdf-lib without breaking the original signature",
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 10,
              padding: "16px 14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8aabb8", marginBottom: 6 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 11, color: "#2e4e5e", lineHeight: 1.6 }}>{item.body}</div>
          </div>
        ))}
      </div>

      <p style={styles.footer}>
        100% client-side • No data leaves your browser
      </p>
    </div>
  );
}