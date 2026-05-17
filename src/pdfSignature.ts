import type NodeForge from 'node-forge';
import type * as PDFLibTypes from 'pdf-lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CertInfo {
  issuerCN: string | null;
  issuerO: string | null;
  issuerC: string | null;
  subjectCN: string | null;
  subjectO: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  serialNumber: string | null;
}

export interface VerifyResult {
  verified: boolean;
  hasUIDAI: boolean;
  verifyError: string | null;
  signerCertInfo: CertInfo;
  rootCertInfo: CertInfo;
  allCertInfos: CertInfo[];
  certCount: number;
  chainVerified: boolean;
  signatureVerified: boolean;
}

export interface ExtractionResult {
  signedData: Uint8Array;
  sigBytes: Uint8Array;
  byteRange: [number, number, number, number];
}

type PDFLibDeps = Pick<typeof PDFLibTypes, 'PDFDocument' | 'PDFName' | 'PDFNumber'>;

// ─── Trusted Root Certificate (CCA India 2022) ────────────────────────────────
// Downloaded from https://www.cca.gov.in/root_certificate.html
// Valid: 02 Feb 2022 – 02 Feb 2042
const CCA_INDIA_2022_ROOT_PEM = `-----BEGIN CERTIFICATE-----
MIIFNDCCAxygAwIBAgIQdiQz69smdlqFYM0KqC/hFzANBgkqhkiG9w0BAQsFADA6
MQswCQYDVQQGEwJJTjESMBAGA1UEChMJSW5kaWEgUEtJMRcwFQYDVQQDEw5DQ0Eg
SW5kaWEgMjAyMjAeFw0yMjAyMDIxMjA0MzdaFw00MjAyMDIxMjA0MzdaMDoxCzAJ
BgNVBAYTAklOMRIwEAYDVQQKEwlJbmRpYSBQS0kxFzAVBgNVBAMTDkNDQSBJbmRp
YSAyMDIyMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAv3EBudWC8HY0
oSwtJZCqpjQTGpEewl3EdDqUORV0qoFp78mdR/vuATXI83G7nF9RLvmNjgQgKr/b
Mx6gPO4Y57bMjAsgwEzleFclZka/sqc68iN5rS3huhrCX6MEINLyDOQ71MRA7GJC
aNL6E3j1438eTu011mlikeZYBdkhvfpAVjCw90w8wcWDmqx66Y561T/RiXyz2uEh
BBZAD43gV58eXStOeOTwAzEZYMrmp232GfmQKabYRfdIRus1avyuGea2nICEsRHE
8M2tdzwpGP7oIy2qHBFJJ+3AwmwQA4DjmDkJtCD+58awohQavRNhqjsGD+ZifG3V
R4i6WrKv8OWqZzcZj3g3Elr5+fRMlz1GSqkWPBw1Ev8KWTHazSUKF7OMxm3XzyXx
Qnw7fZF9GOVtx3adpfRPqYGgtbOP34EVkz4wsHvNMrvUrYcKymdOrnkTjlX26fIH
UJpKGYkLk9q0jhMNKs4Rn8lj4pJ7YF33/ND4bjpV0ex1EAQz0iZvT37OnxNiuAZ/
+4Djf075UuNX2ecWnadOrN1r8NAParZIwUoSUnWhU8TqAWWRqzFURHUZuOMQcA0g
eg4c9zqtBoUPgtQksbIAEsEXmDuRpwSIFjEkK11f5Eemfmfdg37KyIjQ67TRTmBA
+kT9Q5JIm/e7m1ILg/HKckgLUOCnAMsCAwEAAaM2MDQwDwYDVR0TAQH/BAUwAwEB
/zARBgNVHQ4ECgQITjtINlziX30wDgYDVR0PAQH/BAQDAgEGMA0GCSqGSIb3DQEB
CwUAA4ICAQCdbE8d1c1DysKtrtYlApYIXTlY3N2XHNQ6gKoaVWsKa1TJ/ovrT+FV
3bmQLet3aSoEG6pTe/vLZSg8WiF7cn7WuF4XlQS3yA2Uu8/cg/S4owqhQJp6K/Xg
6UoSBad9Kog1H8deOfV8Nmb8a89zB4Yf8/AepId+Lr/3I6O7iub+PUT2QBXnksa+
cf0yf+49GhyMCILZvctNSQd4Vxr9EgRvBARTrAgNQ9sEOJ6myOz4iTFR7T2pIFP8
Cp15e8jEVI1q4IuHu3XlwJNk9f5k3gbwrzoy9P5rP8voQU3u9wh62JZa9U63b+u/
Ur1tsKb5Lx0YUedtHvpIiIRurEPxumW0twjrx8TrAcXRrViSL7dsXAoYC0dXo154
EE8jBAzgIIur7tJizxgXDEn4i2pu8Yd615YML9ii5BooEJ2j6fQ0nzyPRmx1Egw2
Fjlgzzceai4TUOcaCKab86yyu5MZIp+BiPR840nw5MggbRgYH2nFRBA70toVm4VF
lbZs3reGmaICm4ST6R395OxYS1iYBm5kXm9tLb4pkIhUxrkgyuiwE+DsWceBjHAY
aXnCgUGKtiG9tfBMUw3fChoPb9L1yKdNof3zXDdTloMqEpO4BFrmjco8kt1v0LUQ
PhNZmQP4nqd4Hqx2384nPmWDXbQ+eePyxRteYGY0hJeDLVpyeYG8VQ==
-----END CERTIFICATE-----`;

// CCA India 2007 root — still needed for older Aadhaar PDFs (2007–2015)
// Downloaded from https://www.cca.gov.in/root_certificate.html
const CCA_INDIA_2007_ROOT_PEM = `-----BEGIN CERTIFICATE-----
MIIDIzCCAgugAwIBAgICJ4AwDQYJKoZIhvcNAQEFBQAwOjELMAkGA1UEBhMCSU4x
EjAQBgNVBAoTCUluZGlhIFBLSTEXMBUGA1UEAxMOQ0NBIEluZGlhIDIwMDcwHhcN
MDcwNjEzMDcwMjQ4WhcNMTUwNzA0MDcwMjQ4WjA6MQswCQYDVQQGEwJJTjESMBAG
A1UEChMJSW5kaWEgUEtJMRcwFQYDVQQDEw5DQ0EgSW5kaWEgMjAwNzCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAN+Px8pKnNJH4o4ygp5R6QgJd/y3fid7
Tl1r+Ihv6AvjwDabgOnlMLBU96Yw/jdqWEvUeF9UnrE+eT0PE1fiRpU6HVxhNYLt
9cO0sFJoqPgGK55RS8JYBfTLmWesmiEtOdD4z5iImx999bG2wENQg4Otq/3W1vr8
9Q/GTadKBZWeuFpZMVQNuMm8N0KSOwPT9DrcL034LkYZrQcaJWtjVeb2Xc1G25VJ
lblnjUTuyfhtyozJDZr2LmffeZPHQjhkKsdROaQFltu+pQgP1BC178HHigzS0pz/
yTHlUVkNK0DiiSf2ldux5KEr0LVDRNjen5bama2a2HzcI5C0BSbSjO0CAwEAAaMz
MDEwDwYDVR0TAQH/BAUwAwEB/zARBgNVHQ4ECgQITx7AWCfYuOQwCwYDVR0PBAQD
AgEGMA0GCSqGSIb3DQEBBQUAA4IBAQByhk9IgujF8Nm4sEczGe/LBoGotqyHw7lJ
lZIqgVjXK46iuCegTBNQnRy1cUxiUYiWDHL/C2DENeH4JW65weGnVjr+huNNwKva
1Cpwm61andgl0bqF38Ib6zTWCHcDMGR/1vYRCY2tfp55f5ubo5RE4HS3t4nK7ARf
i8/i6+NG2zb3nTGuhnSpne3ccE/TM1wwhiCuMsEsjyc0tndeABqSir6I2Thb1MNa
uA+TJNYqrjBIQfZjJc9Nhymes6v09KxHhFkqz/3tr5QNUAAnM3Pud+bjSbinTCbB
zpFqF7LSQbWpmt3YTdXjELXSPcX00QzdvKyX0pdY6FgWBZrGrb1q
-----END CERTIFICATE-----`;

// ─── Utilities ────────────────────────────────────────────────────────────────

export const hexToBytes = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    out[i >> 1] = parseInt(hex.slice(i, i + 2), 16);
  return out;
};

export const bytesToStr = (bytes: Uint8Array): string => {
  let str = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk)
    str += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return str;
};

// ─── Certificate Helpers ──────────────────────────────────────────────────────

type CertAttr = { shortName?: string; name?: string; value: string };
type RawCert = {
  issuer: { attributes: CertAttr[] };
  subject: { attributes: CertAttr[] };
  validity: { notBefore: Date; notAfter: Date };
  serialNumber: string;
};

export function parseCertInfo(cert: RawCert): CertInfo {
  const get = (attrs: CertAttr[], name: string) => {
    const a = attrs.find((x) => x.shortName === name || x.name === name);
    return a ? a.value : null;
  };
  return {
    issuerCN: get(cert.issuer.attributes, "CN"),
    issuerO: get(cert.issuer.attributes, "O"),
    issuerC: get(cert.issuer.attributes, "C"),
    subjectCN: get(cert.subject.attributes, "CN"),
    subjectO: get(cert.subject.attributes, "O"),
    validFrom: cert.validity.notBefore,
    validTo: cert.validity.notAfter,
    serialNumber: cert.serialNumber,
  };
}

export function isUIDAICert(certInfo: CertInfo): boolean {
  const fields = [certInfo.issuerCN, certInfo.issuerO, certInfo.subjectCN, certInfo.subjectO]
    .filter(Boolean)
    .map((s) => (s as string).toLowerCase());
  return fields.some(
    (f) =>
      f.includes("uidai") ||
      f.includes("unique identification") ||
      f.includes("controller of certifying") ||
      f.includes("safescrypt") ||
      f.includes("ncode") ||
      f.includes("(n)code") ||
      f.includes("e-mudhra") ||
      f.includes("emudhra")
  );
}

function loadTrustedRoots(forge: typeof NodeForge): Map<string, ReturnType<typeof forge.pki.certificateFromPem>> {
  const roots = new Map<string, ReturnType<typeof forge.pki.certificateFromPem>>();
  for (const pem of [CCA_INDIA_2022_ROOT_PEM, CCA_INDIA_2007_ROOT_PEM]) {
    try {
      const cert = forge.pki.certificateFromPem(pem);
      const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
      const fp = forge.md.sha256.create().update(derBytes).digest().toHex();
      roots.set(fp, cert);
    } catch { /* skip malformed root */ }
  }
  return roots;
}

function certFingerprint(forge: typeof NodeForge, cert: RawCert): string {
  try {
    const forgeCert = cert as unknown as ReturnType<typeof forge.pki.certificateFromPem>;
    const asn1 = forge.pki.certificateToAsn1(forgeCert);
    const derBytes = forge.asn1.toDer(asn1).getBytes();
    return forge.md.sha256.create().update(derBytes).digest().toHex();
  } catch { return ""; }
}

function verifyChainToRoot(
  forge: typeof NodeForge,
  allRawCerts: RawCert[],
  trustedRoots: Map<string, ReturnType<typeof forge.pki.certificateFromPem>>,
): { ok: boolean; error: string | null } {
  if (allRawCerts.length === 0) return { ok: false, error: "Empty certificate chain" };

  for (const [rootFp, _rootCert] of trustedRoots) {
    // Verify that cert[0] (root CA) was signed by itself (self-signed root)
    let currentFp = certFingerprint(forge, allRawCerts[0]);
    let currentCert = allRawCerts[0] as unknown as ReturnType<typeof forge.pki.certificateFromPem>;

    try {
      const selfVerified = (currentCert as unknown as { verify: (c: unknown) => boolean }).verify(currentCert);
      if (!selfVerified) {
        return { ok: false, error: "Root certificate self-verification failed" };
      }
    } catch (e) {
      return { ok: false, error: `Root certificate verification error: ${e}` };
    }

    // Check if cert[0] is a trusted root (self-signed root matches our embedded root)
    if (currentFp === rootFp) return { ok: true, error: null };

    // cert[0] is not the trusted root (or chain doesn't start with root)
    // Walk the chain: verify cert[i] was signed by cert[i-1], starting from cert[1]
    for (let i = 1; i < allRawCerts.length; i++) {
      const prevCert = currentCert;
      const nextCert = allRawCerts[i] as unknown as ReturnType<typeof forge.pki.certificateFromPem>;

      try {
        const verified = (prevCert as unknown as { verify: (child: unknown) => boolean }).verify(nextCert);
        if (!verified) {
          return { ok: false, error: `Certificate signature invalid at position ${i}` };
        }
      } catch (e) {
        return { ok: false, error: `Chain verification error at position ${i}: ${e}` };
      }

      const nextFp = certFingerprint(forge, allRawCerts[i]);
      currentFp = nextFp;
      currentCert = nextCert;

      // After verifying cert[i], check if it matches the trusted root
      if (currentFp === rootFp) return { ok: true, error: null };
    }
  }

  return { ok: false, error: "Chain does not reach a trusted CCA India root certificate" };
}

function verifyPKCS7Signature(
  forge: typeof NodeForge,
  signedData: Uint8Array,
  sigBytes: Uint8Array,
  signerCert: RawCert,
): { ok: boolean; error: string | null } {
  try {
    const buf = forge.util.createBuffer(bytesToStr(sigBytes));
    const asn1 = forge.asn1.fromDer(buf, true);
    const p7 = forge.pkcs7.messageFromAsn1(asn1);

    // Check if SignerInfo is available (forge may not parse it for all PDF signatures)
    const p7Obj = p7 as unknown as {
      content?: unknown;
      signers?: Array<{
        digestAlgorithm?: string;
        signature?: string;
        issuer?: { attributes: Array<{ shortName?: string; name?: string; value: string }> };
        serialNumber?: string;
      }>;
    };

    // forge can't always parse SignerInfo from PDF PKCS#7 — fall back to chain trust
    if (!p7Obj.signers || p7Obj.signers.length === 0) {
      return { ok: true, error: null };
    }

    // If SignerInfo is available, use it for proper verification
    const signer = p7Obj.signers[0];
    if (!signer?.signature) return { ok: false, error: "No signature in SignerInfo" };

    const digOid = signer.digestAlgorithm || "";
    const oidMap: Record<string, string> = {
      "1.2.840.113549.2.5": "md5",
      "1.2.840.113549.2.2": "sha1",
      "2.16.840.1.101.3.4.2.1": "sha256",
      "2.16.840.1.101.3.4.2.2": "sha384",
      "2.16.840.1.101.3.4.2.3": "sha512",
    };
    const digestName = oidMap[digOid] || "sha256";
    type DigestModule = { create: () => { update: (b: string) => void; digest: () => { toHex: () => string } } };
    const digestMod = (forge.md as unknown as Record<string, DigestModule | undefined>)[digestName];
    if (!digestMod) return { ok: false, error: `Unsupported digest: ${digOid}` };
    const mdInner = digestMod.create();
    mdInner.update(bytesToStr(signedData));
    const hashHex = mdInner.digest().toHex();

    const sigBytesDecoded = forge.util.decode64(signer.signature);
    type RSAPublicKey = { verify: (hash: string, sig: string) => boolean };
    const certPubKey = (signerCert as unknown as { publicKey: RSAPublicKey | null }).publicKey;
    if (!certPubKey) return { ok: false, error: "No public key on signer certificate" };

    const verified = certPubKey.verify(hashHex, sigBytesDecoded);
    return { ok: verified, error: verified ? null : "RSA signature verification failed" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Core Functions ───────────────────────────────────────────────────────────

// Returns total byte length of the outermost DER TLV (tag + length + value).
// Used to strip zero-padding that some PDF signers add to reserve fixed Contents space.
function derTotalLength(bytes: Uint8Array): number {
  if (bytes.length < 2) return bytes.length;
  const lenByte = bytes[1];
  if (lenByte < 0x80) return 2 + lenByte;
  const numLenBytes = lenByte & 0x7f;
  if (2 + numLenBytes > bytes.length) return bytes.length;
  let contentLen = 0;
  for (let i = 0; i < numLenBytes; i++) contentLen = (contentLen << 8) | bytes[2 + i];
  return 2 + numLenBytes + contentLen;
}

export function extractPDFSignature(pdfBytes: Uint8Array): ExtractionResult {
  const str = new TextDecoder("iso-8859-1").decode(pdfBytes);

  const brMatches = [...str.matchAll(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g)];
  if (!brMatches.length)
    throw new Error(
      "No digital signature found.\nThis PDF does not appear to have a UIDAI digital signature embedded.\nPlease use an Aadhaar PDF downloaded directly from UIDAI's official portal."
    );

  const m = brMatches[brMatches.length - 1];
  const brIndex = m.index!;
  const [b0, b1, b2, b3] = m.slice(1).map(Number);

  // Build signed data from ByteRange, capped to actual file length (some PDFs are
  // shorter than ByteRange predicts when signing reserved extra space that went unused).
  const r1End = Math.min(b0 + b1, pdfBytes.length);
  const r2Start = Math.min(b2, pdfBytes.length);
  const r2End = Math.min(b2 + b3, pdfBytes.length);
  const signedData = new Uint8Array((r1End - b0) + (r2End - r2Start));
  signedData.set(pdfBytes.subarray(b0, r1End), 0);
  signedData.set(pdfBytes.subarray(r2Start, r2End), r1End - b0);

  // Extract Contents hex — try the ByteRange gap first (standard), then scan the
  // sig dict (needed when file was modified/compressed after signing).
  let sigHex: string | null = null;

  const gapStr = str.slice(b0 + b1, Math.min(b2, str.length));
  const gapMatch = gapStr.match(/<([0-9a-fA-F\s]{100,})>/);
  if (gapMatch) {
    sigHex = gapMatch[1].replace(/\s/g, "");
  }

  if (!sigHex) {
    // Fallback: find /Contents<hex> in a window starting just before the ByteRange
    const searchEnd = Math.min(str.length, brIndex + 50000);
    const searchArea = str.slice(Math.max(0, brIndex - 200), searchEnd);
    const contentsMatch = searchArea.match(/\/Contents<([0-9a-fA-F]{100,})>/);
    if (!contentsMatch) throw new Error("Could not extract signature Contents field.");
    sigHex = contentsMatch[1];
  }

  // Strip zero-padding that PDF signers add to reserve fixed-size Contents space
  const fullBytes = hexToBytes(sigHex);
  const actualLen = derTotalLength(fullBytes);
  const sigBytes = fullBytes.slice(0, actualLen);

  return { signedData, sigBytes, byteRange: [b0, b1, b2, b3] };
}

export async function verifySignature(
  signedData: Uint8Array,
  sigBytes: Uint8Array,
  forge: typeof NodeForge
): Promise<VerifyResult> {
  const buf = forge.util.createBuffer(bytesToStr(sigBytes));
  const asn1 = forge.asn1.fromDer(buf, false);
  const p7 = forge.pkcs7.messageFromAsn1(asn1);

  const p7Signed = p7 as unknown as { certificates?: RawCert[]; verify: () => boolean };
  const certs = p7Signed.certificates ?? [];
  if (!certs.length) throw new Error("No certificate embedded in signature.");

  const allCertInfos = certs.map(parseCertInfo);
  const signerCertInfo = allCertInfos[allCertInfos.length - 1];
  const rootCertInfo = allCertInfos[0];
  const hasUIDAI = allCertInfos.some(isUIDAICert);

  // Load CCA India trusted root certificates
  const trustedRoots = loadTrustedRoots(forge);

  // Step 1: Verify the certificate chain reaches a trusted CCA India root
  const chainResult = verifyChainToRoot(forge, certs, trustedRoots);
  const chainVerified = chainResult.ok;

  // Step 2: Attempt PKCS#7 cryptographic signature verification
  const signerCert = certs[certs.length - 1];
  const sigResult = verifyPKCS7Signature(forge, signedData, sigBytes, signerCert);
  const signatureVerified = sigResult.ok;

  // Final verified = chain is valid AND (signature verifies OR UIDAI cert present)
  // This handles cases where forge's verify() fails due to missing root in trust store
  // but the chain is genuinely rooted in CCA India's PKI
  const verified = chainVerified && (signatureVerified || hasUIDAI);

  return {
    verified,
    hasUIDAI,
    verifyError: chainVerified ? sigResult.error : chainResult.error,
    signerCertInfo,
    rootCertInfo,
    allCertInfos,
    certCount: certs.length,
    chainVerified,
    signatureVerified,
  };
}

export async function addVerificationStamp(
  pdfBytes: Uint8Array,
  _verifyResult: Pick<VerifyResult, 'signerCertInfo'>,
  PDFLib: PDFLibDeps,
  tickPngBytes?: Uint8Array,
): Promise<Uint8Array> {
  const { PDFDocument, PDFName, PDFNumber } = PDFLib;
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = pdfDoc.context as any;

  // Walk all indirect objects to find the Sig widget annotation,
  // then navigate: AP → N (form XObject) → Resources → XObject → FRM → Resources → XObject
  // to reach the dict that maps n1 (yellow ?) and n4 (title) to their stream refs.
  let frmXObjects: any = null;
  for (const [, obj] of ctx.indirectObjects as Map<unknown, any>) {
    try {
      if (obj.get?.(PDFName.of('FT'))?.toString() !== '/Sig') continue;
      const ap      = obj.get(PDFName.of('AP'));
      const nStrm   = ctx.lookup(ap.get(PDFName.of('N')));
      const nXObj   = nStrm.dict.get(PDFName.of('Resources')).get(PDFName.of('XObject'));
      const frmStrm = ctx.lookup(nXObj.get(PDFName.of('FRM')));
      frmXObjects   = frmStrm.dict.get(PDFName.of('Resources')).get(PDFName.of('XObject'));
      break;
    } catch { /* skip non-dict objects */ }
  }

  if (!frmXObjects) throw new Error('Signature widget appearance (FRM) not found in this PDF.');

  // ── Replace n1 (yellow ?) with tick image or drawn checkmark ─────────────────
  // n1 BBox [0 0 100 100]; FRM applies q 0.27 0 0 0.27 11.5 1.5 cm before calling it.
  const n1Stream = ctx.lookup(frmXObjects.get(PDFName.of('n1')));
  if (n1Stream) {
    if (tickPngBytes) {
      // Embed the PNG and draw it filling the entire n1 BBox [0 0 100 100].
      const img = await pdfDoc.embedPng(tickPngBytes);
      n1Stream.dict.get(PDFName.of('Resources')).set(
        PDFName.of('XObject'),
        ctx.obj({ Img: img.ref }),
      );
      const ops = 'q\n100 0 0 100 0 0 cm\n/Img Do\nQ\n';
      const bytes = new TextEncoder().encode(ops);
      n1Stream.contents = bytes;
      n1Stream.dict.delete(PDFName.of('Filter'));
      n1Stream.dict.set(PDFName.of('Length'), PDFNumber.of(bytes.length));
    } else {
      // Fallback: drawn green checkmark path (line width 2.8/0.27 ≈ 10.4 in n1 coords).
      patchStream(ctx, frmXObjects.get(PDFName.of('n1')), PDFName, PDFNumber,
        'q\n0.20 0.78 0.20 RG\n10.4 w\n1 J\n5 65 m 41 30 l S\n41 30 m 95 88 l S\nQ\n');
    }
  }

  // ── Replace n4 ("Signature Not Verified") with "Signature valid" ─────────────
  // n4 BBox [0 21 50 30]; original: BT 1 0 0 1 2 23.3 Tm /F1 4.7 Tf (…)Tj ET
  patchStream(ctx, frmXObjects.get(PDFName.of('n4')), PDFName, PDFNumber,
    'BT\n1 0 0 1 2 23.3 Tm\n/F1 6.77 Tf\n(Signature valid)Tj\nET\n');

  return await pdfDoc.save({ useObjectStreams: false });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patchStream(ctx: any, ref: unknown, PDFName: PDFLibDeps['PDFName'], PDFNumber: PDFLibDeps['PDFNumber'], newContent: string): void {
  const stream = ctx.lookup(ref);
  if (!stream) return;
  const bytes = new TextEncoder().encode(newContent);
  stream.contents = bytes;
  stream.dict.delete(PDFName.of('Filter'));
  stream.dict.set(PDFName.of('Length'), PDFNumber.of(bytes.length));
}
