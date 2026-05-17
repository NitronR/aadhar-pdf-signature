# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # TypeScript check + production build
npm run lint      # ESLint
npm run preview   # preview production build
```

There are no tests.

## Architecture

This is a single-page React + TypeScript + Vite app. All logic lives in [src/App.tsx](src/App.tsx) (~837 lines). There is no routing, no state management library, and no backend.

### Runtime library loading

`forge.js` (PKCS#7 / crypto) and `pdf-lib` (PDF stamping) are loaded at runtime from CDN via a `loadScript` helper in `App.tsx`. They are not imported as ES modules. The loaded globals are typed in [src/types/global.d.ts](src/types/global.d.ts) (`window.forge`, `window.PDFLib`). The npm packages `node-forge` and `pdf-lib` in `package.json` are present only for their TypeScript types, not for their runtime code.

### Core processing pipeline (all client-side, no server)

1. **`extractPDFSignature`** — scans raw PDF bytes for `/ByteRange` to locate signed data ranges, then extracts the hex-encoded PKCS#7 blob from the `Contents` field.
2. **`verifySignature`** — uses `window.forge` to parse ASN.1, extract the certificate chain, detect UIDAI certs via `isUIDAICert`, and attempt cryptographic verification. If forge's trust store rejects the chain but a UIDAI cert is present, it falls back to considering it verified.
3. **`addVerificationStamp`** — uses `window.PDFLib` to draw a green badge on page 1 of the PDF without invalidating the original signature (appends only).

### State machine

The app cycles through three steps: `"upload"` → `"analyzing"` → `"result"`. The `Step` type and `SignatureResult` / `CertInfo` interfaces are defined at the top of `App.tsx`.

### Styles

All styles are plain JS objects defined in the `styles` const near the bottom of `App.tsx` — no CSS modules, no Tailwind, no styled-components.

## Key constraints

- **Strict TypeScript**: `strict`, `noUnusedLocals`, `noUnusedParameters` are all enabled. TSC is run as part of `npm run build`.
- **rules.md** documents pitfalls with file-writing tools from prior sessions — worth reading if doing large refactors.
- The `.ignore/` directory contains a sample Aadhaar PDF used for manual testing; it is git-ignored.
