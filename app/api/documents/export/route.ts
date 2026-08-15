import { NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { requireTierFeatures, tierError } from '@/lib/billing/guards';

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const features = await requireTierFeatures(userId);
    if (!features.exportEnabled) {
      return tierError(
        'EXPORT_NOT_INCLUDED',
        'Document export is available on the Advisor plan.',
        'advisor'
      );
    }

    const documents = await db.document.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        originalName: true,
        year: true,
        isTaxRelevant: true,
        taxAmount: true,
        createdAt: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error('Document export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
