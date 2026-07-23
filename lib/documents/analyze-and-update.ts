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

  const filePath = resolveDocumentFilePath(document.userId, document.fileUrl);
  if (filePath) {
    try {
      const buffer = await readFile(filePath);
      fileHash = computeFileHash(buffer);

      if (!extractedText && document.mimeType === 'application/pdf') {
        try {
          extractedText = await extractPdfText(buffer);
          contentHash = computeContentHash(extractedText);
        } catch (error) {
          console.error('Failed to extract PDF text during reanalysis:', error);
        }
      } else if (extractedText) {
        contentHash = computeContentHash(extractedText);
      }
    } catch (error) {
      console.error('Failed to read file during reanalysis:', error);
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

  const updated = await db.document.update({
    where: { id: document.id },
    data: {
      isTaxRelevant: analysis.isTaxRelevant || false,
      taxAmount: analysis.taxAmount || null,
      taxCategory: analysis.taxCategory || null,
      categoryId,
      year: analysis.year || new Date().getFullYear(),
      fileHash,
      contentHash,
      extractedText: extractedText.substring(0, 10000) || null,
      extractedData: JSON.stringify(analysis),
      aiConfidence: analysis.confidence || null,
      tags: JSON.stringify(analysis.suggestions || []),
    },
    include: { category: true },
  });

  return formatDocumentResponse(updated);
}
