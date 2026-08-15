import { createHash } from 'crypto';

export function computeFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function computeContentHash(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
  if (normalized.length < 40) {
    return null;
  }

  return createHash('sha256').update(normalized).digest('hex');
}

export async function computeFileHashFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeHashesForFiles(
  files: File[]
): Promise<Map<File, string>> {
  const entries = await Promise.all(
    files.map(async (file) => [file, await computeFileHashFromFile(file)] as const)
  );
  return new Map(entries);
}

export function normalizeDocumentText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function calculateTextSimilarity(left: string, right: string): number {
  const normalizedLeft = normalizeDocumentText(left);
  const normalizedRight = normalizeDocumentText(right);

  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;

  if (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    const shorter = Math.min(normalizedLeft.length, normalizedRight.length);
    const longer = Math.max(normalizedLeft.length, normalizedRight.length);
    return shorter / longer;
  }

  const leftWords = new Set(normalizedLeft.split(' ').filter(Boolean));
  const rightWords = new Set(normalizedRight.split(' ').filter(Boolean));
  if (leftWords.size === 0 || rightWords.size === 0) return 0;

  let intersection = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) intersection += 1;
  }

  const union = new Set([...leftWords, ...rightWords]).size;
  return union === 0 ? 0 : intersection / union;
}
