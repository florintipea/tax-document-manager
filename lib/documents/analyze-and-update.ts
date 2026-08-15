import { readFile } from 'fs/promises';
import { DocumentAnalyzer } from '@/lib/ai/document-analyzer';
import { extractPdfText } from '@/lib/utils/pdf';
import { computeFileHash, computeContentHash } from '@/lib/utils/file-hash';
import {
  findOrCreateCategory,
  ensureDefaultCategories,
} from '@/lib/tax/default-categories';
import {
  formatDocumentResponse,
  resolveDocumentFilePath,
} from '@/lib/utils/documents';
import { db } from '@/lib/db/client';
import { applyPriorElsterProfileRefresh } from '@/lib/tax/autofill-apply';

type DbDocument = {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  fileUrl: string;
  extractedText: string | null;
};

export async function analyzeAndUpdateDocument(
  document: DbDocument,
  country: string,
  language: string
) {
  await ensureDefaultCategories(db, country);

  let extractedText = document.extractedText || '';
  let fileHash: string | null = null;
  let contentHash: string | null = document.extractedText
    ? computeContentHash(document.extractedText)
    : null;

  // Avoid loading full PDFs into RAM when text is already stored (Starter ~512MB).
  const needsFileRead = !extractedText;
  const filePath = resolveDocumentFilePath(document.userId, document.fileUrl);
  if (filePath && needsFileRead) {
    let buffer: Buffer | null = null;
    try {
      buffer = await readFile(filePath);
      fileHash = computeFileHash(buffer);

      if (document.mimeType === 'application/pdf') {
        try {
          extractedText = await extractPdfText(buffer);
          contentHash = computeContentHash(extractedText);
        } catch (error) {
          console.error('Failed to extract PDF text during reanalysis:', error);
        }
      }
    } catch (error) {
      console.error('Failed to read file during reanalysis:', error);
    } finally {
      // Drop reference ASAP so GC can reclaim before AI/DB work.
      buffer = null;
    }
  }

  const analysis = await DocumentAnalyzer.analyzeDocument(
    document.originalName || document.name,
    extractedText,
    document.mimeType,
    { country, language }
  );

  let categoryId: string | null = null;
  if (analysis.category) {
    categoryId = await findOrCreateCategory(db, analysis.category, country);
  }

  const textForStore = extractedText.substring(0, 10000) || null;
  // Release long extract before DB write + profile refresh.
  extractedText = textForStore || '';

  const updated = await db.document.update({
    where: { id: document.id },
    data: {
      isTaxRelevant: analysis.isTaxRelevant || false,
      taxAmount: analysis.taxAmount || null,
      taxCategory: analysis.taxCategory || null,
      categoryId,
      year: analysis.year || new Date().getFullYear(),
      ...(fileHash ? { fileHash } : {}),
      ...(contentHash ? { contentHash } : {}),
      extractedText: textForStore,
      extractedData: JSON.stringify(analysis),
      aiConfidence: analysis.confidence || null,
      tags: JSON.stringify(analysis.suggestions || []),
    },
    select: {
      id: true,
      userId: true,
      name: true,
      originalName: true,
      categoryId: true,
      fileUrl: true,
      fileSize: true,
      fileHash: true,
      contentHash: true,
      mimeType: true,
      thumbnailUrl: true,
      year: true,
      date: true,
      isTaxRelevant: true,
      taxAmount: true,
      taxCategory: true,
      aiConfidence: true,
      tags: true,
      notes: true,
      isOffline: true,
      lastSynced: true,
      createdAt: true,
      updatedAt: true,
      category: true,
    },
  });

  // Prior ELSTER / Steuerbescheid → Steuerprofil-Vorschlag (idempotent)
  try {
    await applyPriorElsterProfileRefresh({
      userId: document.userId,
      fileName: document.originalName || document.name,
      content: textForStore,
      documentId: document.id,
    });
  } catch (profileErr) {
    console.error('Prior ELSTER profile refresh during analyze failed:', profileErr);
  }

  return formatDocumentResponse(updated);
}
