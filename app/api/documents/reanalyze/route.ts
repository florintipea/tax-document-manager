import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { analyzeAndUpdateDocument } from '@/lib/documents/analyze-and-update';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { uploadLimits } from '@/lib/utils/upload-limits';

export async function POST() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await checkRateLimit(userId, {
      windowMs: 60 * 1000,
      maxRequests: 4,
      keyPrefix: 'ratelimit:reanalyze',
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Reanalyse-Anfragen. Bitte kurz warten.' },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { country: true, language: true },
    });

    const country = user?.country || 'US';
    const language = user?.language || 'en';

    // IDs only first — load extractedText one document at a time (Starter RAM).
    const documentIds = await db.document.findMany({
      where: { userId },
      select: { id: true },
      take: uploadLimits.batchAutofillRequestMax,
      orderBy: { updatedAt: 'asc' },
    });

    let updatedCount = 0;
    const errors: Array<{ documentId: string; name: string; error: string }> = [];

    for (const { id } of documentIds) {
      const document = await db.document.findUnique({
        where: { id },
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
      if (!document) continue;

      try {
        await analyzeAndUpdateDocument(document, country, language);
        updatedCount += 1;
      } catch (err) {
        console.error('Reanalyze single document error:', document.id, err);
        errors.push({
          documentId: document.id,
          name: document.name,
          error: err instanceof Error ? err.message : 'Analyse fehlgeschlagen',
        });
      }
    }

    return NextResponse.json({
      message: 'Documents recategorized successfully',
      count: updatedCount,
      // Do not echo full document payloads (memory + response size).
      truncated: documentIds.length >= uploadLimits.batchAutofillRequestMax,
      errors,
      errorCount: errors.length,
    });
  } catch (error) {
    console.error('Reanalyze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
