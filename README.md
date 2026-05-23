# Aadhaar PDF Verifier

Verify the UIDAI digital signature in your eAadhaar PDF and download a stamped copy — entirely in your browser, no server involved.

**Live:** [aadhaar-pdf-signature.pages.dev](https://aadhar-pdf-signature.pages.dev) &nbsp;·&nbsp; **Hindi:** `/hi/`

---

## Features

- Handles **password-protected** (encrypted) Aadhaar PDFs — the standard format from UIDAI's portal
- Extract and parse PKCS#7 / CMS digital signatures embedded in the PDF
- **Two-step verification**: cryptographic PKCS#7 check + certificate chain to CCA India root
- Detect UIDAI certificate chain (Safescrypt, e-Mudhra, nCode, NIC)
- Display full signer certificate details (issuer, subject, validity, serial number)
- Generate a visually stamped PDF with a green "Signature Valid" badge
- 100% client-side — your file never leaves your device

## How It Works

1. **Extract** — Locates the `ByteRange` and `Contents` (PKCS#7) fields embedded by UIDAI
2. **Decrypt** (if encrypted) — Decrypts the PDF in-browser using `@pdfsmaller/pdf-decrypt`; the password is never sent anywhere
3. **Verify** — Two-step validation:
   - **Certificate chain**: walks leaf → intermediate CA → root, verifying each RSA link and confirming the chain terminates at a CCA India trusted root
   - **PKCS#7 signature**: verifies the cryptographic signature over the signed byte ranges using forge.js
4. **Stamp** — Appends a visual stamp to the PDF using pdf-lib without touching (and thus invalidating) the original signature

## Certificate Chain

Two CCA India root certificates are embedded in the app:

| Root | Valid |
|------|-------|
| CCA India 2007 | 13 Jun 2007 – 04 Jul 2015 |
| CCA India 2022 | 02 Feb 2022 – 02 Feb 2042 |

`verified` = `chainVerified AND (signatureVerified OR hasUIDAI)`

The UIDAI fallback handles cases where forge's PKCS#7 check fails due to a missing trust store but the chain genuinely reaches a CCA root.

## Tech Stack

- **React 19 + TypeScript + Vite 8**
- [forge.js](https://github.com/digitalbazaar/forge) — PKCS#7 parsing, ASN.1, RSA crypto (loaded from CDN at runtime)
- [pdf-lib](https://github.com/Hopding/pdf-lib) — PDF stamping (loaded from CDN at runtime)
- [@pdfsmaller/pdf-decrypt](https://www.npmjs.com/package/@pdfsmaller/pdf-decrypt) — in-browser PDF decryption
- **Cloudflare Pages** — hosting and deployment via Wrangler

> The npm packages `node-forge` and `pdf-lib` in `package.json` are present only for their TypeScript types. The actual runtime code is loaded from CDN via a `loadScript` helper so the main bundle stays small.

## Commands

```bash
npm install          # install dependencies
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # TypeScript check + production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run preview      # build + preview via Wrangler (mirrors production)
npm run deploy       # build + deploy to Cloudflare Pages
```

## Project Structure

```
src/
  App.tsx           # UI and processing pipeline (~1000 lines)
  pdfSignature.ts   # Core logic: extract, verify, decrypt, stamp
  types/
    global.d.ts     # Window types for forge and PDFLib globals
  test/
    pdfSignature.test.ts
    fixtures/
public/
  hi/               # Hindi locale (static HTML)
  signature_valid_sample.png
  tick.png
  og-image.png
```

## Privacy

Your Aadhaar PDF is processed entirely in your browser. To verify:

1. Open DevTools → Network tab before uploading — you'll see zero requests containing your file.
2. Or disconnect from the internet after the page loads — the tool still works.

The complete source code is open for inspection in this repository.

## Notes

- Only processes PDFs with embedded digital signatures
- For encrypted PDFs, enter your password in the app (format: first 4 letters of name in caps + year of birth, e.g. `RAHU1990`)
- The stamped PDF is intended for **printing / physical submission**. Share the original eAadhaar where the recipient validates the digital signature electronically
- CRL/OCSP revocation checking is not implemented
