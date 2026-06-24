import { NextRequest, NextResponse } from "next/server";
import { requireSessionUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { DocumentAnalyzer, type DocumentAnalysis } from "@/lib/ai/document-analyzer";
import { extractPdfText } from "@/lib/utils/pdf";
import {
  buildStoredFileName,
  buildStoredFilePath,
  formatDocumentResponse,
  getUserUploadDir,
  uploadLimits,
} from "@/lib/utils/documents";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  ensureDefaultCategories,
  findOrCreateCategory,
} from "@/lib/tax/default-categories";
import { computeContentHash, computeFileHash } from "@/lib/utils/file-hash";
import { findExistingContentDuplicate } from "@/lib/documents/duplicates";
import { checkDocumentUploadAllowed } from "@/lib/billing/guards";
import {
  mimeTypeForKind,
  validateUploadMagicBytes,
} from "@/lib/security/file-magic";

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx",
]);

function isAllowedUpload(file: File): boolean {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
  return ALLOWED_EXTENSIONS.has(extension);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(userId, {
      windowMs: 60 * 1000,
      maxRequests: 10,
      keyPrefix: "ratelimit:upload",
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 }
      );
    }

    const uploadGate = await checkDocumentUploadAllowed(userId);
    if (!uploadGate.allowed) {
      return uploadGate.response;
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedDocuments = [];
    const skippedFiles: string[] = [];
    const contentDuplicates: Array<{
      fileName: string;
      matchType: string;
      similarity?: number;
      newDocument: ReturnType<typeof formatDocumentResponse>;
      existingDocument: {
        id: string;
        name: string;
        originalName: string;
        fileSize: number;
        createdAt: Date | string;
        category?: { name: string } | null;
      };
    }> = [];

    const uploadsDir = getUserUploadDir(userId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { country: true, language: true },
    });

    const country = user?.country || 'US';
    const language = user?.language || 'en';

    await ensureDefaultCategories(db, country);

    for (const file of files) {
      if (file.size > uploadLimits.maxFileSize) {
        skippedFiles.push(`${file.name} (exceeds ${uploadLimits.maxFileSizeLabel})`);
        continue;
      }

      if (!isAllowedUpload(file)) {
        skippedFiles.push(`${file.name} (unsupported file type)`);
        continue;
      }

      if (file.type === "application/octet-stream") {
        skippedFiles.push(`${file.name} (generic binary type not allowed)`);
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const magicCheck = validateUploadMagicBytes(buffer, file.name);
      if (!magicCheck.ok) {
        skippedFiles.push(`${file.name} (${magicCheck.reason})`);
        continue;
      }

      const storedMimeType = mimeTypeForKind(magicCheck.kind);
      const fileHash = computeFileHash(buffer);
      const storedFileName = buildStoredFileName(file.name);
      const filePath = buildStoredFilePath(userId, storedFileName);
      await writeFile(filePath, buffer);

      let extractedText = "";
      let analysis: DocumentAnalysis;

      try {
        if (storedMimeType === "application/pdf") {
          try {
            extractedText = await extractPdfText(buffer);
          } catch (pdfError) {
            console.error("PDF parsing error:", pdfError);
          }
        }

        analysis = await DocumentAnalyzer.analyzeDocument(
          file.name,
          extractedText,
          storedMimeType,
          { country, language }
        );
      } catch (analysisError) {
        console.error("AI analysis error:", analysisError);
        analysis = {
          isTaxRelevant: false,
          category: "Other",
          year: new Date().getFullYear(),
          confidence: 0.5,
        };
      }

      const contentHash = computeContentHash(extractedText);

      let categoryId: string | null = null;
      if (analysis.category) {
        categoryId = await findOrCreateCategory(db, analysis.category, country);
      }

      const document = await db.document.create({
        data: {
          userId,
          name: file.name,
          originalName: file.name,
          fileUrl: `/uploads/${userId}/${storedFileName}`,
          fileSize: file.size,
          fileHash,
          contentHash,
          mimeType: storedMimeType,
          year: analysis.year || new Date().getFullYear(),
          date: new Date(),
          isTaxRelevant: analysis.isTaxRelevant || false,
          taxAmount: analysis.taxAmount || null,
          taxCategory: analysis.taxCategory || null,
          categoryId,
          extractedText: extractedText.substring(0, 10000) || null,
          extractedData: JSON.stringify(analysis),
          aiConfidence: analysis.confidence || null,
          tags: JSON.stringify(analysis.suggestions || []),
        },
        include: {
          category: true,
        },
      });

      const formattedDocument = formatDocumentResponse(document);
      uploadedDocuments.push(formattedDocument);

      const duplicateMatch = await findExistingContentDuplicate(db, userId, {
        fileHash,
        contentHash,
        extractedText,
        excludeDocumentId: document.id,
      });

      if (duplicateMatch) {
        contentDuplicates.push({
          fileName: file.name,
          matchType: duplicateMatch.matchType,
          similarity: duplicateMatch.similarity,
          newDocument: formattedDocument,
          existingDocument: duplicateMatch.existingDocument,
        });
      }
    }

    if (uploadedDocuments.length === 0) {
      return NextResponse.json(
        {
          error: "No files were uploaded",
          skippedFiles,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Files uploaded successfully",
      documents: uploadedDocuments,
      skippedFiles,
      contentDuplicates,
      hasContentDuplicates: contentDuplicates.length > 0,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
