import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import type { PrismaClient } from '@prisma/client';
import { formatDocumentResponse, resolveDocumentFilePath } from '@/lib/utils/documents';
import {
  calculateTextSimilarity,
  computeContentHash,
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

type SlimDoc = {
  id: string;
  name: string;
  originalName: string;
  fileSize: number;
  fileHash: string | null;
  contentHash: string | null;
  fileUrl: string;
  createdAt: Date;
  category?: { name: string } | null;
};

type TextCandidate = SlimDoc & { extractedText: string | null };

const TEXT_SIMILARITY_THRESHOLD = 0.88;
/** Cap text-similarity scan — newest docs first; avoids loading every user's archive. */
const TEXT_CANDIDATE_LIMIT = 200;
/** Legacy docs without fileHash: hash at most this many files from disk. */
const LEGACY_HASH_LIMIT = 40;

const slimSelect = {
  id: true,
  name: true,
  originalName: true,
  fileSize: true,
  fileHash: true,
  contentHash: true,
  fileUrl: true,
  createdAt: true,
  category: { select: { name: true } },
} as const;

function toExisting(doc: SlimDoc): DuplicateExistingDocument {
  return formatDocumentResponse({
    ...doc,
    tags: '[]',
    extractedText: null,
    extractedData: null,
  }) as DuplicateExistingDocument;
}

async function hashFileFromDisk(filePath: string): Promise<string | null> {
  try {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    for await (const chunk of stream) {
      hash.update(chunk as Buffer);
    }
    return hash.digest('hex');
  } catch {
    return null;
  }
}

/**
 * Find an existing duplicate without loading every document's extractedText.
 * Order: exact fileHash → exact contentHash → capped text similarity → legacy disk hash.
 */
export async function findExistingContentDuplicate(
  db: PrismaClient,
  userId: string,
  input: {
    fileHash: string;
    contentHash: string | null;
    extractedText: string;
    excludeDocumentId: string;
  }
): Promise<ContentDuplicateResult | null> {
  const exclude = { id: { not: input.excludeDocumentId } };

  const byFileHash = await db.document.findFirst({
    where: { userId, ...exclude, fileHash: input.fileHash },
    select: slimSelect,
  });
  if (byFileHash) {
    return { existingDocument: toExisting(byFileHash), matchType: 'file' };
  }

  if (input.contentHash) {
    const byContentHash = await db.document.findFirst({
      where: { userId, ...exclude, contentHash: input.contentHash },
      select: slimSelect,
    });
    if (byContentHash) {
      return {
        existingDocument: toExisting(byContentHash),
        matchType: 'content',
      };
    }
  }

  if (input.extractedText.trim().length >= 80) {
    const textCandidates = await db.document.findMany({
      where: {
        userId,
        ...exclude,
        extractedText: { not: null },
      },
      select: {
        ...slimSelect,
        extractedText: true,
      },
      take: TEXT_CANDIDATE_LIMIT,
      orderBy: { createdAt: 'desc' },
    });

    let bestMatch: { candidate: TextCandidate; similarity: number } | null = null;

    for (const candidate of textCandidates) {
      if (!candidate.extractedText || candidate.extractedText.trim().length < 80) {
        continue;
      }

      // Prefer contentHash when present (already checked globally, but legacy rows may lack it).
      const candidateContentHash =
        candidate.contentHash || computeContentHash(candidate.extractedText);
      if (
        input.contentHash &&
        candidateContentHash &&
        candidateContentHash === input.contentHash
      ) {
        return {
          existingDocument: toExisting(candidate),
          matchType: 'content',
        };
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
        existingDocument: toExisting(bestMatch.candidate),
        matchType: 'text',
        similarity: bestMatch.similarity,
      };
    }
  }

  // Legacy rows without fileHash: stream-hash a small recent set (not the whole library).
  const legacy = await db.document.findMany({
    where: { userId, ...exclude, fileHash: null },
    select: slimSelect,
    take: LEGACY_HASH_LIMIT,
    orderBy: { createdAt: 'desc' },
  });

  for (const candidate of legacy) {
    const filePath = resolveDocumentFilePath(userId, candidate.fileUrl);
    if (!filePath) continue;
    const diskHash = await hashFileFromDisk(filePath);
    if (diskHash && diskHash === input.fileHash) {
      return { existingDocument: toExisting(candidate), matchType: 'file' };
    }
  }

  return null;
}
