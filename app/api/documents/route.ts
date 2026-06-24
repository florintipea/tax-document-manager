import { NextRequest, NextResponse } from "next/server";
import { requireSessionUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { formatDocumentResponse } from "@/lib/utils/documents";
import { z } from "zod";

const documentSchema = z.object({
  name: z.string().min(1).max(500),
  originalName: z.string().min(1).max(500),
  fileUrl: z
    .string()
    .regex(/^\/uploads\/[^/]+\/[^/]+$/, 'Invalid file path'),
  fileSize: z.number().positive().max(100 * 1024 * 1024),
  mimeType: z.string().max(200),
  year: z.number().int().min(2000).max(2100),
  date: z.string().datetime(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(10000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const categoryId = searchParams.get("categoryId");
    const isTaxRelevant = searchParams.get("isTaxRelevant");
    const search = searchParams.get("search");

    const where: {
      userId: string;
      year?: number;
      categoryId?: string;
      isTaxRelevant?: boolean;
      OR?: Array<{
        name?: { contains: string };
        extractedText?: { contains: string };
        notes?: { contains: string };
      }>;
    } = {
      userId,
    };

    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        where.year = yearNum;
      }
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isTaxRelevant === "true") {
      where.isTaxRelevant = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { extractedText: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const documents = await db.document.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      documents: documents.map(formatDocumentResponse),
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = documentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const expectedPrefix = `/uploads/${userId}/`;
    if (!validated.data.fileUrl.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Forbidden file path" }, { status: 403 });
    }

    const document = await db.document.create({
      data: {
        ...validated.data,
        userId,
        date: new Date(validated.data.date),
        tags: validated.data.tags ? JSON.stringify(validated.data.tags) : "[]",
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      { document: formatDocumentResponse(document) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
