import type forge from 'node-forge';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function gtag(...args: any[]): void;

  interface Window {
    forge: typeof forge;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfjsLib: any;
    PDFLib: {
      PDFDocument: typeof import('pdf-lib').PDFDocument;
      PDFName: typeof import('pdf-lib').PDFName;
      PDFNumber: typeof import('pdf-lib').PDFNumber;
      rgb: typeof import('pdf-lib').rgb;
      StandardFonts: typeof import('pdf-lib').StandardFonts;
    };
  }
}

export {};
