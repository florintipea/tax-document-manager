import { readFile } from 'fs/promises';
import { formatDocumentResponse, resolveDocumentFilePath } from '@/lib/utils/documents';
import {
  calculateTextSimilarity,
  computeContentHash,
  computeFileHash,
} from '@/lib/utils/file-hash';

export interface DuplicateExistingDocument {
  id: string;
  name: string;
  originalName: string;
  fileSize: number;
  createdAt: Date | string;
  category?: { name: string } | null;
}

export type DuplicateMatchType = 'file' | 'content' | 'text';

export interface ContentDuplicateResult {
  existingDocument: DuplicateExistingDocument;
  matchType: DuplicateMatchType;
  similarity?: number;
}

type DocumentRecord = {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  fileSize: number;
  fileHash: string | null;
  contentHash: string | null;
  fileUrl: string;
  extractedText: string | null;
  tags: unknown;
  createdAt: Date;
  category?: { name: string } | null;
};

const TEXT_SIMILARITY_THRESHOLD = 0.88;

async function resolveStoredFileHash(
  userId: string,
  document: DocumentRecord
): Promise<string | null> {
  if (document.fileHash) return document.fileHash;

  const filePath = resolveDocumentFilePath(userId, document.fileUrl);
  if (!filePath) return null;

  try {
    const buffer = await readFile(filePath);
    return computeFileHash(buffer);
  } catch {
    return null;
  }
}

function resolveStoredContentHash(document: DocumentRecord): string | null {
  if (document.contentHash) return document.contentHash;
  if (!document.extractedText) return null;
  return computeContentHash(document.extractedText);
}

export async function findExistingContentDuplicate(
  db: {
    document: {
      findMany: (args: {
        where: { userId: string; id?: { not: string } };
        include?: { category: true };
      }) => Promise<DocumentRecord[]>;
    };
  },
  userId: string,
  input: {
    fileHash: string;
    contentHash: string | null;
    extractedText: string;
    excludeDocumentId: string;
  }
): Promise<ContentDuplicateResult | null> {
  const candidates = await db.document.findMany({
    where: {
      userId,
      id: { not: input.excludeDocumentId },
    },
    include: { category: true },
  });

  for (const candidate of candidates) {
    const candidateFileHash = await resolveStoredFileHash(userId, candidate);
    if (candidateFileHash && candidateFileHash === input.fileHash) {
      return {
        existingDocument: formatDocumentResponse(candidate) as DuplicateExistingDocument,
        matchType: 'file',
      };
    }
  }

  if (input.contentHash) {
    for (const candidate of candidates) {
      const candidateContentHash = resolveStoredContentHash(candidate);
      if (candidateContentHash && candidateContentHash === input.contentHash) {
        return {
          existingDocument: formatDocumentResponse(candidate) as DuplicateExistingDocument,
          matchType: 'content',
        };
      }
    }
  }

  if (input.extractedText.trim().length >= 80) {
    let bestMatch: { candidate: DocumentRecord; similarity: number } | null = null;

    for (const candidate of candidates) {
      if (!candidate.extractedText || candidate.extractedText.trim().length < 80) {
        continue;
      }

      const similarity = calculateTextSimilarity(
        input.extractedText,
        candidate.extractedText
      );

      if (similarity >= TEXT_SIMILARITY_THRESHOLD) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { candidate, similarity };
        }
      }
    }

    if (bestMatch) {
      return {
        existingDocument: formatDocumentResponse(
          bestMatch.candidate
        ) as DuplicateExistingDocument,
        matchType: 'text',
        similarity: bestMatch.similarity,
      };
    }
  }

  return null;
}
