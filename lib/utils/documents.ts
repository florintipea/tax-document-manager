import 'server-only';
import { join, basename, normalize } from 'path';
import { getUploadsRoot } from '@/lib/utils/paths';

export function getUserUploadDir(userId: string): string {
  return join(getUploadsRoot(), userId);
}

export function sanitizeFileName(originalName: string): string {
  const base = basename(originalName.replace(/\0/g, ''))
    .replace(/[/\\]/g, '_')
    .replace(/[^\w.\- ()]/g, '_');
  if (!base || base === '.' || base === '..') {
    return 'upload.bin';
  }
  return base.slice(0, 200);
}

export function buildStoredFileName(originalName: string): string {
  return `${Date.now()}-${sanitizeFileName(originalName)}`;
}

export function buildStoredFilePath(userId: string, storedFileName: string): string {
  const userDir = getUserUploadDir(userId);
  const resolved = normalize(join(userDir, storedFileName));
  if (!resolved.startsWith(normalize(userDir))) {
    throw new Error('Invalid file path');
  }
  return resolved;
}

export function resolveDocumentFilePath(userId: string, fileUrl: string): string | null {
  const prefix = `/uploads/${userId}/`;
  if (!fileUrl.startsWith(prefix)) {
    return null;
  }

  const storedName = fileUrl.slice(prefix.length);
  if (!storedName || storedName.includes('..') || /[/\\]/.test(storedName)) {
    return null;
  }

  try {
    return buildStoredFilePath(userId, storedName);
  } catch {
    return null;
  }
}

export function getDocumentDownloadPath(documentId: string): string {
  return `/api/documents/${documentId}/file`;
}

export function parseDocumentTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string');
  }

  if (typeof tags !== 'string' || !tags.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [];
  } catch {
    return [];
  }
}

export type FormatDocumentOptions = {
  /**
   * Include extractedText / extractedData in the payload.
   * Default false — list/upload/batch paths must not echo multi-KB text blobs.
   */
  includeExtracted?: boolean;
};

export function formatDocumentResponse<T extends { id: string; tags: unknown }>(
  document: T,
  options: FormatDocumentOptions = {}
) {
  const { includeExtracted = false } = options;
  const record = document as T & {
    extractedText?: unknown;
    extractedData?: unknown;
  };

  if (includeExtracted) {
    return {
      ...document,
      tags: parseDocumentTags(document.tags),
      fileUrl: getDocumentDownloadPath(document.id),
    };
  }

  const { extractedText: _t, extractedData: _d, ...rest } = record;
  return {
    ...rest,
    tags: parseDocumentTags(document.tags),
    fileUrl: getDocumentDownloadPath(document.id),
    extractedText: null,
    extractedData: null,
  };
}

export { uploadLimits } from '@/lib/utils/upload-limits';
