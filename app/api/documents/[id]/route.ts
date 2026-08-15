import { NextRequest, NextResponse } from "next/server";
import { requireSessionUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { formatDocumentResponse, resolveDocumentFilePath } from "@/lib/utils/documents";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  try {
    const userId = await requireSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await db.document.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        fileUrl: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filePath = resolveDocumentFilePath(userId, document.fileUrl);
    if (filePath && existsSync(filePath)) {
      await unlink(filePath);
    }

    await db.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  try {
    const userId = await requireSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await db.document.findUnique({
      where: { id: params.id },
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
        // Detail view does not need multi-KB extracted blobs in JSON.
        category: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ document: formatDocumentResponse(document) });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
