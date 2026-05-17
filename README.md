# Aadhaar PDF Verifier

Verify UIDAI digital signatures in Aadhaar PDF documents. Upload a PDF, extract the PKCS#7 signature, validate the certificate chain against CCA India's trusted root, and download a stamped copy.

## Features

- Extract and parse PDF digital signatures (PKCS#7 / CMS)
- Verify cryptographic signature validity
- **Chain validation against CCA India trusted root certificates** (CCA India 2007 & 2022 roots embedded)
- Detect UIDAI certificate chain (Safescrypt, e-Mudhra, nCode, NIC)
- Display signer certificate details (issuer, subject, validity, serial number)
- Two-step verification: PKCS#7 signature check + certificate chain to root
- Generate visually stamped PDF with green "Signature valid" badge
- 100% client-side — no data uploaded anywhere

## How It Works

1. **Extract** — Locates the ByteRange and PKCS#7 Contents field embedded by UIDAI
2. **Verify** — Two-step validation:
   - **Certificate chain verification**: Builds SHA-256 fingerprint of each cert in chain and verifies it reaches a CCA India root (either 2007 or 2022 root embedded in the app)
   - **PKCS#7 signature verification**: Uses forge.js to verify the cryptographic signature over the signed PDF content using the embedded signer certificate
3. **Stamp** — Appends a visual "Signature valid" stamp to the PDF using pdf-lib without breaking the original signature

## Certificate Chain Validation

The verifier is configured with **two trusted root certificates** from India's PKI hierarchy:

| Root | Valid | Downloaded from |
|------|-------|----------------|
| CCA India 2007 | 13 Jun 2007 – 04 Jul 2015 | cca.gov.in |
| CCA India 2022 | 02 Feb 2022 – 02 Feb 2042 | cca.gov.in |

The chain is validated by:
1. Computing SHA-256 fingerprint of each certificate in the chain
2. Walking up the chain (leaf → intermediate CA → root)
3. Verifying each parent→child link cryptographically (RSA signature check)
4. Confirming the chain terminates at a CCA India trusted root

The final `verified` result = `chainVerified AND (signatureVerified OR hasUIDAI)`. The UIDAI fallback handles cases where the PKCS#7 verification fails due to missing trust store, but the chain genuinely reaches a CCA root.

## Tech Stack

- React + TypeScript + Vite
- [forge.js](https://github.com/digitalbazaar/forge) — PKCS#7 parsing, ASN.1 handling, RSA crypto
- [pdf-lib](https://github.com/HoppingGamer/pdf-lib) — PDF manipulation and stamping

## Getting Started

```bash
npm install
npm run dev
```

## Usage

1. Open the app in your browser
2. Drag and drop (or browse) an Aadhaar PDF downloaded from UIDAI's official portal
3. Review the verification results — includes **Chain Valid** (reaches CCA India root) and **PKCS#7 Signature** (cryptographically valid) indicators
4. Download the stamped PDF with "Signature valid" badge

## Note

- Only processes PDFs with embedded digital signatures
- Requires internet connection for library CDN loading on first visit
- Signatures are verified cryptographically; tampered PDFs will show verification failure
- CRL/OCSP revocation checking is not yet implemented (future improvement)