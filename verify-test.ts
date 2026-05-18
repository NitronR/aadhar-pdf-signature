import forge from 'node-forge';
import * as PDFLib from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';
import { extractPDFSignature, verifySignature, addVerificationStamp, decryptPDF } from './src/pdfSignature.ts';

const PDF_PATH = '/Users/bhanu-mac/Desktop/Projects/aadhar-pdf-signature/.ignore/Aadhar.pdf';
const pdfBytes = new Uint8Array(readFileSync(PDF_PATH));

console.log('─── Extract ───────────────────────────────');
const { signedData, sigBytes, byteRange } = extractPDFSignature(pdfBytes);
console.log('ByteRange:      ', byteRange.join(', '));
console.log('Signature size: ', sigBytes.length, 'bytes');

console.log('\n─── Verify ────────────────────────────────');
const result = await verifySignature(signedData, sigBytes, forge);
console.log('Verified:       ', result.verified);
console.log('Chain verified: ', result.chainVerified);
console.log('Sig verified:   ', result.signatureVerified);
console.log('UIDAI cert:     ', result.hasUIDAI);
console.log('Cert chain:     ', result.certCount, 'certificate(s)');
if (result.verifyError) console.log('Verify error:   ', result.verifyError);

console.log('\n─── Debug ────────────────────────────────');

// Extract certs from p7
const buf2 = forge.util.createBuffer(Buffer.from(sigBytes).toString('binary'));
const asn1 = forge.asn1.fromDer(buf2, false);
const p7 = forge.pkcs7.messageFromAsn1(asn1);
const certs = (p7 as any).certificates ?? [];
console.log('Cert count:', certs.length);

for (let i = 0; i < certs.length; i++) {
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(certs[i])).getBytes();
  const fp = forge.md.sha256.create().update(der).digest().toHex();
  console.log(`  cert[${i}] fp:`, fp.substring(0, 16) + '...');
}

// Load trusted roots inline
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

const rootCert = forge.pki.certificateFromPem(CCA_INDIA_2022_ROOT_PEM);
const rootDer = forge.asn1.toDer(forge.pki.certificateToAsn1(rootCert)).getBytes();
const rootFp = forge.md.sha256.create().update(rootDer).digest().toHex();
console.log('Embedded root fp:', rootFp.substring(0, 16) + '...');
console.log('Match cert[0]:', rootFp === certFingerprintFromCert(forge, certs[0]) ? 'YES' : 'NO');

function certFingerprintFromCert(f: typeof forge, cert: any): string {
  const der = f.asn1.toDer(f.pki.certificateToAsn1(cert)).getBytes();
  return f.md.sha256.create().update(der).digest().toHex();
}

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
  console.log('\n─── Decrypt ───────────────────────────────');
  const decryptedBytes = await decryptPDF(pdfBytes, 'BHAN1999', PDFLib, forge);
  console.log('Decrypted size:', decryptedBytes.length, 'bytes');

  console.log('\n─── Stamp ─────────────────────────────────');
  const TICK_PATH = '/Users/bhanu-mac/Desktop/Projects/aadhar-pdf-signature/tick.png';
  const tickPngBytes = new Uint8Array(readFileSync(TICK_PATH));
  const stamped = await addVerificationStamp(decryptedBytes, result, PDFLib, tickPngBytes);
  const outPath = PDF_PATH.replace('.pdf', '_verified.pdf');
  writeFileSync(outPath, Buffer.from(stamped));
  console.log('Stamped PDF →  ', outPath);
}
