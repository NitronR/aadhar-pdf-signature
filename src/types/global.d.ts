import type forge from 'node-forge';

declare global {
  interface Window {
    forge: typeof forge;
    PDFLib: {
      PDFDocument: typeof import('pdf-lib').PDFDocument;
      PDFName: typeof import('pdf-lib').PDFName;
      PDFNumber: typeof import('pdf-lib').PDFNumber;
    };
  }
}

export {};
