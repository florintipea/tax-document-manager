import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFParse } from 'pdf-parse';

let workerConfigured = false;

/** Tax Belege rarely need more than the first N pages for category/amount/ELSTER hints. */
const DEFAULT_MAX_PAGES = Number(process.env.PDF_EXTRACT_MAX_PAGES || 40);
/** Hard cap on in-memory extract string (DB still stores ≤10k). */
const DEFAULT_MAX_CHARS = Number(process.env.PDF_EXTRACT_MAX_CHARS || 100_000);

function ensurePdfWorker() {
  if (workerConfigured) return;

  const workerPath = join(
    process.cwd(),
    'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
  );

  PDFParse.setWorker(pathToFileURL(workerPath).href);
  workerConfigured = true;
}

export type ExtractPdfTextOptions = {
  /** Max pages to parse (1-based first N). Quality-preserving for typical tax PDFs. */
  maxPages?: number;
  /** Truncate extracted string to this many characters. */
  maxChars?: number;
};

/**
 * Extract plain text from a PDF buffer.
 * Page-limited by default to avoid multi-hundred-page heap spikes on Starter RAM
 * without cutting classification quality for normal Belege / Bescheide.
 */
export async function extractPdfText(
  buffer: Buffer,
  options: ExtractPdfTextOptions = {}
): Promise<string> {
  ensurePdfWorker();

  const maxPages =
    Number.isFinite(options.maxPages) && (options.maxPages as number) > 0
      ? Math.min(options.maxPages as number, 200)
      : Number.isFinite(DEFAULT_MAX_PAGES) && DEFAULT_MAX_PAGES > 0
        ? Math.min(DEFAULT_MAX_PAGES, 200)
        : 40;

  const maxChars =
    Number.isFinite(options.maxChars) && (options.maxChars as number) > 0
      ? (options.maxChars as number)
      : Number.isFinite(DEFAULT_MAX_CHARS) && DEFAULT_MAX_CHARS > 0
        ? DEFAULT_MAX_CHARS
        : 100_000;

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText({
      first: maxPages,
      // Avoid per-page banners bloating the string we keep briefly in RAM.
      pageJoiner: '\n',
    });
    const text = result.text.trim();
    return text.length > maxChars ? text.slice(0, maxChars) : text;
  } finally {
    await parser.destroy();
  }
}
