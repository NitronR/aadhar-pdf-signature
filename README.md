# Aadhaar PDF Verifier

Verify UIDAI digital signatures in Aadhaar PDF documents. Upload a PDF, extract the PKCS#7 signature, validate the certificate chain, and download a stamped copy.

## Features

- Extract and parse PDF digital signatures (PKCS#7)
- Verify cryptographic signature validity
- Detect UIDAI certificate chain
- Display signer certificate details (issuer, subject, validity, serial number)
- Generate visually stamped PDF with verification badge
- 100% client-side — no data uploaded anywhere

## How It Works

1. **Extract** — Locates the ByteRange and PKCS#7 Contents field embedded by UIDAI
2. **Verify** — Parses the certificate chain and validates the cryptographic signature using forge.js
3. **Stamp** — Appends a visual verification stamp to the PDF using pdf-lib without breaking the original signature

## Tech Stack

- React + TypeScript + Vite
- [forge.js](https://github.com/digitalbazaar/forge) — PKCS#7 parsing and cryptographic verification
- [pdf-lib](https://github.com/HoppingGamer/pdf-lib) — PDF manipulation and stamping

## Getting Started

```bash
npm install
npm run dev
```

## Usage

1. Open the app in your browser
2. Drag and drop (or browse) an Aadhaar PDF downloaded from UIDAI's official portal
3. Review the verification results and certificate details
4. Download the stamped PDF with verification badge

## Note

- Only processes PDFs with embedded digital signatures
- Requires internet connection for library CDN loading on first visit
- Signatures are verified cryptographically; tampered PDFs will show verification failure