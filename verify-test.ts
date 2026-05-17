import forge from 'node-forge';
import * as PDFLib from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';
import { extractPDFSignature, verifySignature, addVerificationStamp } from './src/pdfSignature.ts';

const PDF_PATH = '/Users/bhanu-mac/Desktop/Projects/aadhar-pdf-signature/.ignore/Aadhar.pdf';
const pdfBytes = new Uint8Array(readFileSync(PDF_PATH));

console.log('─── Extract ───────────────────────────────');
const { signedData, sigBytes, byteRange } = extractPDFSignature(pdfBytes);
console.log('ByteRange:      ', byteRange.join(', '));
console.log('Signature size: ', sigBytes.length, 'bytes');

console.log('\n─── Verify ────────────────────────────────');
const result = await verifySignature(signedData, sigBytes, forge);
console.log('Verified:       ', result.verified);
console.log('UIDAI cert:     ', result.hasUIDAI);
console.log('Cert chain:     ', result.certCount, 'certificate(s)');
if (result.verifyError) console.log('Verify error:   ', result.verifyError);

console.log('\n─── Signer Certificate ────────────────────');
const s = result.signerCertInfo;
console.log('Issuer org:     ', s.issuerO ?? '—');
console.log('Issuer CN:      ', s.issuerCN ?? '—');
console.log('Subject CN:     ', s.subjectCN ?? '—');
console.log('Subject org:    ', s.subjectO ?? '—');
console.log('Valid from:     ', s.validFrom?.toLocaleDateString('en-IN') ?? '—');
console.log('Valid to:       ', s.validTo?.toLocaleDateString('en-IN') ?? '—');
console.log('Serial:         ', s.serialNumber?.match(/.{1,8}/g)?.join(' ') ?? '—');

console.log('\n─── Root CA ───────────────────────────────');
const r = result.rootCertInfo;
console.log('Issuer org:     ', r.issuerO ?? '—');
console.log('Issuer CN:      ', r.issuerCN ?? '—');

if (result.verified) {
  console.log('\n─── Stamp ─────────────────────────────────');
  const TICK_PATH = '/Users/bhanu-mac/Desktop/Projects/aadhar-pdf-signature/tick.png';
  const tickPngBytes = new Uint8Array(readFileSync(TICK_PATH));
  const stamped = await addVerificationStamp(pdfBytes, result, PDFLib, tickPngBytes);
  const outPath = PDF_PATH.replace('.pdf', '_verified.pdf');
  writeFileSync(outPath, Buffer.from(stamped));
  console.log('Stamped PDF →  ', outPath);
}
