import { NextRequest, NextResponse } from "next/server";
import { requireSessionUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import { resolveDocumentFilePath } from "@/lib/utils/documents";

export async function GET(
  request: NextRequest,
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
        mimeType: true,
        originalName: true,
        fileSize: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filePath = resolveDocumentFilePath(userId, document.fileUrl);
    if (!filePath || !existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const download = request.nextUrl.searchParams.get("download") === "1";
    const disposition = download ? "attachment" : "inline";

    // Stream from disk — never hold the full PDF/image in the Node heap.
    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(document.originalName)}"`,
        "Cache-Control": "private, no-store",
        ...(document.fileSize > 0
          ? { "Content-Length": String(document.fileSize) }
          : {}),
      },
    });
  } catch (error) {
    console.error("Download document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
