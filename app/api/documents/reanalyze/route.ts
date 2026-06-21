import { NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { analyzeAndUpdateDocument } from '@/lib/documents/analyze-and-update';

export async function POST() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { country: true, language: true },
    });

    const country = user?.country || 'US';
    const language = user?.language || 'en';

    const documents = await db.document.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        name: true,
        originalName: true,
        mimeType: true,
        fileUrl: true,
        extractedText: true,
      },
    });

    const updatedDocuments = [];
    for (const document of documents) {
      const updated = await analyzeAndUpdateDocument(document, country, language);
      updatedDocuments.push(updated);
    }

    return NextResponse.json({
      message: 'Documents recategorized successfully',
      count: updatedDocuments.length,
      documents: updatedDocuments,
    });
  } catch (error) {
    console.error('Reanalyze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
