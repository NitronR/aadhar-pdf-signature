/**
 * Generates a PKCS#7-signed test PDF + an encrypted variant (password: RIA1999).
 * Uses only node-forge (already a project dependency) — no external tools needed.
 *
 * Outputs:
 *   src/test/fixtures/test-signed.pdf        — unencrypted, signed with test certs
 *   src/test/fixtures/test-root-cert.pem     — test root CA PEM (pass to verifySignature)
 *   .ignore/test_signed_7char.pdf            — same PDF encrypted with password RIA1999
 *
 * Usage: node scripts/generate-test-pdf.mjs
 */

import forge from 'node-forge';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const FIXTURES  = join(ROOT, 'src/test/fixtures');
const IGNORE    = join(ROOT, '.ignore');

mkdirSync(FIXTURES, { recursive: true });
mkdirSync(IGNORE,   { recursive: true });

// ── 1. Generate test certificate chain ───────────────────────────────────────

console.log('Generating test certificate chain…');

const rootKeys = forge.pki.rsa.generateKeyPair(2048);
const rootCert = forge.pki.createCertificate();
rootCert.publicKey = rootKeys.publicKey;
rootCert.serialNumber = '01';
rootCert.validity.notBefore = new Date('2024-01-01');
rootCert.validity.notAfter  = new Date('2034-01-01');
const rootAttrs = [
  { name: 'commonName',       value: 'Test CCA India Root' },
  { name: 'organizationName', value: 'Controller of Certifying Authorities' },
  { name: 'countryName',      value: 'IN' },
];
rootCert.setSubject(rootAttrs);
rootCert.setIssuer(rootAttrs);
rootCert.setExtensions([
  { name: 'basicConstraints', cA: true, critical: true },
  { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
]);
rootCert.sign(rootKeys.privateKey, forge.md.sha256.create());

const sigKeys = forge.pki.rsa.generateKeyPair(2048);
const sigCert = forge.pki.createCertificate();
sigCert.publicKey = sigKeys.publicKey;
sigCert.serialNumber = '02';
sigCert.validity.notBefore = new Date('2024-01-01');
sigCert.validity.notAfter  = new Date('2034-01-01');
sigCert.setSubject([
  { name: 'commonName',       value: 'DS Unique Identification Authority of India 06' },
  { name: 'organizationName', value: 'Unique Identification Authority of India' },
  { name: 'countryName',      value: 'IN' },
]);
sigCert.setIssuer(rootAttrs);
sigCert.setExtensions([
  { name: 'basicConstraints', cA: false, critical: true },
  { name: 'keyUsage', digitalSignature: true, nonRepudiation: true, critical: true },
]);
sigCert.sign(rootKeys.privateKey, forge.md.sha256.create());

const rootPem = forge.pki.certificateToPem(rootCert);
writeFileSync(join(FIXTURES, 'test-root-cert.pem'), rootPem);
console.log('  ✓ test-root-cert.pem');

// ── 2. Build a minimal signed PDF ────────────────────────────────────────────
//
// Layout:
//   [partA: everything up to but not including '<']   ← signed range 1
//   <[hex-encoded PKCS#7 padded to SIG_HEX_LEN chars]>  ← NOT signed (Contents gap)
//   [partB: rest of PDF]                              ← signed range 2
//
// ByteRange = [0, len(partA), len(partA)+len(gap), len(partB)]

console.log('Building PDF skeleton…');

const SIG_HEX_LEN = 16384; // 8 KB DER → 16384 hex chars (generous padding)
const NUM_WIDTH   = 10;     // fixed-width field for each ByteRange number

function padNum(n) { return String(n).padStart(NUM_WIDTH, ' '); }

// Placeholder values — same width as padNum output
const PH = ['AAAAAAAAAA', 'BBBBBBBBBB', 'CCCCCCCCCC', 'DDDDDDDDDD'];

// partA: signed range 1
let partA = '';
partA += '%PDF-1.4\n';
partA += '1 0 obj\n<</Type /Catalog /Pages 2 0 R /AcroForm 5 0 R>>\nendobj\n';
partA += '2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n';
partA += '3 0 obj\n<</Type /Page /MediaBox [0 0 612 792] /Parent 2 0 R>>\nendobj\n';
partA += '4 0 obj\n';
partA += '<<\n';
partA += '/Type /Sig\n';
partA += '/Filter /Adobe.PPKLite\n';
partA += '/SubFilter /adbe.pkcs7.detached\n';
// ByteRange uses fixed-width placeholders so we can patch in place
partA += `/ByteRange [${PH[0]} ${PH[1]} ${PH[2]} ${PH[3]}]\n`;
partA += '/Contents ';  // ← signed range 1 ends here; '<' begins the gap

// partB: signed range 2 (immediately after the '>' that closes Contents)
// Must include xref + trailer so pypdf can parse/encrypt the file.
// We compute xref offsets after we know b1/b2 (the gap), so build partB in two stages.
let partBPrefix = '';
partBPrefix += '\n>>\nendobj\n';
partBPrefix += '5 0 obj\n<</Type /AcroForm /Fields [4 0 R]>>\nendobj\n';

// We will append xref + trailer after computing offsets (see below).

// Compute object offsets within partA for xref table
// Object offsets (byte positions from start of file)
const obj1Off = Buffer.byteLength('%PDF-1.4\n', 'binary');
const obj2Off = obj1Off + Buffer.byteLength('1 0 obj\n<</Type /Catalog /Pages 2 0 R /AcroForm 5 0 R>>\nendobj\n', 'binary');
const obj3Off = obj2Off + Buffer.byteLength('2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n', 'binary');
const obj4Off = obj3Off + Buffer.byteLength('3 0 obj\n<</Type /Page /MediaBox [0 0 612 792] /Parent 2 0 R>>\nendobj\n', 'binary');
// obj4 (sig dict) starts at obj4Off — its exact size includes the placeholder ByteRange

// Compute byte offsets (using byte lengths, not char lengths — ASCII-safe here)
const b0 = 0;
const b1 = Buffer.byteLength(partA, 'binary');
const gap = '<' + '0'.repeat(SIG_HEX_LEN) + '>';  // placeholder hex contents
const b2 = b1 + Buffer.byteLength(gap, 'binary');

// obj5 offset = b2 + len(partBPrefix)
const obj5Off = b2 + Buffer.byteLength(partBPrefix, 'binary');
const xrefOff = obj5Off + Buffer.byteLength('5 0 obj\n<</Type /AcroForm /Fields [4 0 R]>>\nendobj\n', 'binary');

// Build xref + trailer
const xref = [
  'xref\n',
  `0 6\n`,
  `0000000000 65535 f \n`,
  `${String(obj1Off).padStart(10, '0')} 00000 n \n`,
  `${String(obj2Off).padStart(10, '0')} 00000 n \n`,
  `${String(obj3Off).padStart(10, '0')} 00000 n \n`,
  `${String(obj4Off).padStart(10, '0')} 00000 n \n`,
  `${String(obj5Off).padStart(10, '0')} 00000 n \n`,
].join('');
const trailer = `trailer\n<</Size 6 /Root 1 0 R>>\nstartxref\n${xrefOff}\n%%EOF\n`;

const partB = partBPrefix + xref + trailer;
const b3 = Buffer.byteLength(partB, 'binary');

// Patch ByteRange placeholders in partA
partA = partA
  .replace(PH[0], padNum(b0))
  .replace(PH[1], padNum(b1))
  .replace(PH[2], padNum(b2))
  .replace(PH[3], padNum(b3));

// ── 3. Compute SHA-256 over the signed bytes ─────────────────────────────────

const signedRange1 = Buffer.from(partA, 'binary');
const signedRange2 = Buffer.from(partB, 'binary');
const signedData   = Buffer.concat([signedRange1, signedRange2]);

const md = forge.md.sha256.create();
md.update(forge.util.binary.raw.encode(new Uint8Array(signedData)));
const docDigest = md.digest().getBytes(); // raw binary string

// ── 4. Build PKCS#7 SignedData with SignedAttributes ─────────────────────────

const asn1 = forge.asn1;

function oid(str)    { return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID,         false, asn1.oidToDer(str).getBytes()); }
function integer(n)  { return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER,     false, String.fromCharCode(n)); }
function octetStr(s) { return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, s); }
function seq(...ch)  { return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE,    true,  ch); }
function set(...ch)  { return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET,         true,  ch); }
function ctx0(...ch) { return asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, ch); }

// SignedAttributes (tag [0] IMPLICIT — forge uses CONTEXT class, tag 0)
const signedAttrs = ctx0(
  // contentType
  seq(oid('1.2.840.113549.1.9.3'), set(oid('1.2.840.113549.1.7.1'))),
  // messageDigest
  seq(oid('1.2.840.113549.1.9.4'), set(octetStr(docDigest))),
  // signingTime
  seq(oid('1.2.840.113549.1.9.5'), set(
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.UTCTIME, false,
      asn1.dateToUtcTime(new Date()).replace(/Z$/, '+0000'))
  )),
);

// The bytes that are actually signed = DER(signedAttrs) with [0] tag → SET (0x31)
const signedAttrsDer = Buffer.from(asn1.toDer(signedAttrs).getBytes(), 'binary');
signedAttrsDer[0] = 0x31; // rewrite [0] IMPLICIT → SET OF

// RSA-SHA256 sign
const sigMd = forge.md.sha256.create();
sigMd.update(forge.util.binary.raw.encode(new Uint8Array(signedAttrsDer)));
const rsaSignature = sigKeys.privateKey.sign(sigMd);

// IssuerAndSerialNumber for the signing cert
const signerIssuer = forge.pki.distinguishedNameToAsn1(sigCert.issuer);
const signerSerial = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
  forge.util.hexToBytes(sigCert.serialNumber));

// Embed both root cert and signing cert so verifyChainToRoot can walk the chain
const rootCertAsn1   = forge.pki.certificateToAsn1(rootCert);
const sigCertAsn1    = forge.pki.certificateToAsn1(sigCert);

const signedDataNode = seq(
  integer(1),  // version
  // digestAlgorithms
  set(seq(oid('2.16.840.1.101.3.4.2.1'), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, ''))),
  // encapContentInfo (id-data, no eContent = detached)
  seq(oid('1.2.840.113549.1.7.1')),
  // [0] certificates
  ctx0(rootCertAsn1, sigCertAsn1),
  // signerInfos
  set(
    seq(
      integer(1),  // version
      // sid: IssuerAndSerialNumber
      seq(signerIssuer, signerSerial),
      // digestAlgorithm
      seq(oid('2.16.840.1.101.3.4.2.1'), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '')),
      // signedAttrs [0] IMPLICIT
      signedAttrs,
      // signatureAlgorithm: sha256WithRSAEncryption
      seq(oid('1.2.840.113549.1.1.11'), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '')),
      // signature
      octetStr(rsaSignature),
    )
  ),
);

// Wrap in ContentInfo — [0] EXPLICIT uses CONTEXT class, tag 0 (same tag byte 0xA0 as certificates)
const contentInfo = seq(
  oid('1.2.840.113549.1.7.2'),  // id-signedData
  ctx0(signedDataNode),
);

const pkcs7Der = asn1.toDer(contentInfo).getBytes();
const pkcs7Hex = forge.util.bytesToHex(pkcs7Der);

if (pkcs7Hex.length > SIG_HEX_LEN) {
  throw new Error(`PKCS#7 hex (${pkcs7Hex.length}) exceeds reserved Contents space (${SIG_HEX_LEN}). Increase SIG_HEX_LEN.`);
}

// Pad hex to SIG_HEX_LEN with trailing zeros (standard PDF signature padding)
const paddedHex = pkcs7Hex.padEnd(SIG_HEX_LEN, '0');
const contentsField = '<' + paddedHex + '>';

// ── 5. Assemble final PDF ─────────────────────────────────────────────────────

const pdfBuf = Buffer.concat([
  Buffer.from(partA, 'binary'),
  Buffer.from(contentsField, 'binary'),
  Buffer.from(partB, 'binary'),
]);

const signedPdfPath = join(FIXTURES, 'test-signed.pdf');
writeFileSync(signedPdfPath, pdfBuf);
console.log(`  ✓ test-signed.pdf (${pdfBuf.length} bytes, sig ${pkcs7Hex.length / 2} bytes DER)`);

// ── 6. Encrypt with pypdf (password: RIA1999) ─────────────────────────────────

const encryptedPath = join(IGNORE, 'test_signed_7char.pdf');
try {
  execSync(`python3 -c "
import pypdf, sys
r = pypdf.PdfReader('${signedPdfPath}')
w = pypdf.PdfWriter()
for p in r.pages: w.add_page(p)
w.encrypt('RIA1999', algorithm='AES-256')
with open('${encryptedPath}', 'wb') as f: w.write(f)
print('encrypted ok')
"`, { stdio: 'inherit' });
  console.log('  ✓ test_signed_7char.pdf (password: RIA1999) → .ignore/');
} catch {
  console.warn('  ⚠ Could not encrypt PDF (pypdf not available) — skipping encrypted variant');
}

console.log('\nDone. Run: npx vitest run');
