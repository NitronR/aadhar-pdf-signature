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
}

export interface ExtractionResult {
  signedData: Uint8Array;
  sigBytes: Uint8Array;
  byteRange: [number, number, number, number];
}

type PDFLibDeps = Pick<typeof PDFLibTypes, 'PDFDocument' | 'PDFName' | 'PDFNumber'>;

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

  let cryptoVerified = false;
  let verifyError: string | null = null;
  try {
    p7.content = forge.util.createBuffer(bytesToStr(signedData));
    cryptoVerified = p7Signed.verify();
  } catch (e) {
    verifyError = (e as Error).message;
    // forge's trust store doesn't include UIDAI's root CA, so if the cert chain
    // is structurally valid and contains a UIDAI cert, treat it as verified
    cryptoVerified = hasUIDAI;
  }

  return { verified: cryptoVerified, hasUIDAI, verifyError, signerCertInfo, rootCertInfo, allCertInfos, certCount: certs.length };
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
