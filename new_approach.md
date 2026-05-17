## Generating a New PDF with Green Tick ✅

There are **3 distinct approaches** depending on what you actually need:

---

## Approach 1: 🖼️ Visual Green Tick Overlay (Simplest)
> Just stamps a visual green tick — **not a real digital signature**. Good for reports/previews.

### Libraries needed:
```bash
npm install pdf-lib @pdf-lib/fontkit
```

```javascript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function addGreenTickOverlay(inputPdfPath, outputPdfPath) {
  const existingPdfBytes = fs.readFileSync(inputPdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width } = firstPage.getSize();

  // Draw green verification banner
  firstPage.drawRectangle({
    x: 20,
    y: 10,
    width: width - 40,
    height: 30,
    color: rgb(0.9, 1.0, 0.9),
    borderColor: rgb(0.0, 0.6, 0.0),
    borderWidth: 1.5,
  });

  // Green tick + text
  firstPage.drawText('✔ Signature Verified — UIDAI / NIC Certificate Chain Valid', {
    x: 30,
    y: 18,
    size: 11,
    font,
    color: rgb(0.0, 0.55, 0.0),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPdfPath, pdfBytes);
  console.log('✅ PDF saved with green tick overlay');
}

addGreenTickOverlay('aadhaar.pdf', 'aadhaar_verified.pdf');
```

---

## Approach 2: 🔏 Real Digital Signature (Actual Green Tick in Adobe)
> Adds a **real cryptographic signature** to the PDF. Adobe will show a genuine green tick if your certificate is trusted.

### Libraries needed:
```bash
npm install @signpdf/signpdf @signpdf/placeholder-pdf-lib pdf-lib node-forge
```

### Step 1 — Create/Load Your Certificate
```javascript
import forge from 'node-forge';

// Option A: Load your existing .p12 / .pfx certificate
const p12Buffer = fs.readFileSync('your-certificate.p12');
const p12Asn1  = forge.asn1.fromDer(p12Buffer.toString('binary'));
const p12      = forge.pkcs12.pkcs12FromAsn1(p12Asn1, 'your-password');

// Option B: Generate a self-signed cert (for testing)
function generateSelfSignedCert() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert  = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter  = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + 5
  );

  const attrs = [
    { name: 'commonName',       value: 'Aadhaar Verifier' },
    { name: 'organizationName', value: 'My Org' },
    { name: 'countryName',      value: 'IN' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);   // self-signed
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    cert:       forge.pki.certificateToPem(cert),
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
  };
}
```

### Step 2 — Add Signature Placeholder to PDF
```javascript
import { PDFDocument } from 'pdf-lib';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';

async function preparePdfForSigning(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  // Add a signature placeholder (required before signing)
  await pdflibAddPlaceholder({
    pdfDoc,
    reason:   'Aadhaar Signature Verified',
    contactInfo: 'verify@example.com',
    name:     'Aadhaar Verifier',
    location: 'India',
    signatureLength: 8192,   // enough space for PKCS#7 blob
  });

  return Buffer.from(await pdfDoc.save({ addDefaultPage: false }));
}
```

### Step 3 — Sign the PDF
```javascript
import SignPdf from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';

async function signPdf(pdfBuffer, p12Buffer, password) {
  const signer = new P12Signer(p12Buffer, { passphrase: password });

  const signedPdf = await SignPdf.sign(pdfBuffer, signer);
  return signedPdf;
}
```

### Step 4 — Full Pipeline
```javascript
async function generateVerifiedPdf(inputPath, outputPath, p12Path, password) {
  // 1. Load original Aadhaar PDF
  const originalPdf = fs.readFileSync(inputPath);

  // 2. Add signature placeholder
  const preparedPdf = await preparePdfForSigning(originalPdf);

  // 3. Sign it
  const p12Buffer = fs.readFileSync(p12Path);
  const signedPdf = await signPdf(preparedPdf, p12Buffer, password);

  // 4. Save
  fs.writeFileSync(outputPath, signedPdf);
  console.log('✅ Signed PDF generated:', outputPath);
}

generateVerifiedPdf(
  'aadhaar.pdf',
  'aadhaar_signed.pdf',
  'certificate.p12',
  'your-p12-password'
);
```

---

## Approach 3: 🔐 LTV (Long Term Validation) — Best for Production
> Embeds **OCSP + CRL + timestamp** so the PDF validates even without internet. Shows green tick permanently.

### Libraries needed:
```bash
npm install @signpdf/signpdf node-forge pkijs asn1js axios
```

```javascript
import axios from 'axios';
import forge from 'node-forge';

// 1. Fetch OCSP response to prove cert is not revoked
async function fetchOcspResponse(cert, issuerCert) {
  const ocspUrl = cert.getExtension('authorityInfoAccess')
    ?.value?.match(/OCSP - URI:(.*)/)?.[1]?.trim();

  const ocspReq = forge.ocsp.createRequest();
  ocspReq.addCertificate(cert, issuerCert);

  const response = await axios.post(ocspUrl, ocspReq.toBuffer(), {
    headers: { 'Content-Type': 'application/ocsp-request' },
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data);
}

// 2. Embed OCSP + DSS (Document Security Store) into PDF
async function addLtvToPdf(pdfBuffer, ocspResponse) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  // Add DSS dictionary with OCSP data
  const dssDict = pdfDoc.context.obj({
    Type:  'DSS',
    OCSPs: pdfDoc.context.obj([ocspResponse]),
  });

  pdfDoc.catalog.set(
    pdfDoc.context.obj('DSS'),
    pdfDoc.context.register(dssDict)
  );

  return Buffer.from(await pdfDoc.save());
}
```

---

## 📊 Which Approach Should You Use?

| Approach | Green Tick in Adobe? | Real Signature? | Complexity | Use Case |
|---|---|---|---|---|
| **Visual Overlay** | ❌ (visual only) | ❌ | Easy | Internal reports, previews |
| **Re-sign with cert** | ✅ (if cert trusted) | ✅ | Medium | Verified document workflow |
| **LTV + Timestamp** | ✅ Permanently | ✅ | Hard | Legal/archival documents |

---

## 🗂️ Recommended Full Stack

```
aadhaar.pdf
    ↓
node-forge          → verify original UIDAI signature
    ↓
pdf-lib             → load PDF, add placeholder
    ↓
@signpdf/signpdf    → sign with your P12 cert
    ↓
LTV (optional)      → embed OCSP for permanent validity
    ↓
aadhaar_verified.pdf ✅
```

> **Note:** For the green tick to appear in Adobe without manually importing your cert, your signing certificate must be issued by a CA that is in **Adobe's AATL (Approved Trust List)**. For internal use, distribute your root cert to users. For public use, get a certificate from a trusted CA like **eMudhra, Sify, or NSDL** (all AATL-trusted Indian CAs).