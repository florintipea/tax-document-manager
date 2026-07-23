import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFParse } from 'pdf-parse';

let workerConfigured = false;

function ensurePdfWorker() {
  if (workerConfigured) return;

  const workerPath = join(
    process.cwd(),
    'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
  );

  PDFParse.setWorker(pathToFileURL(workerPath).href);
  workerConfigured = true;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  ensurePdfWorker();

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
