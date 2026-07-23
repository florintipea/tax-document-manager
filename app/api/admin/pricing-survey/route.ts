import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 200), 500);

    const [responses, stats] = await Promise.all([
      db.pricingSurvey.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      db.pricingSurvey.groupBy({
        by: ['priceRange'],
        _count: { priceRange: true },
        _avg: { willingToPay: true },
      }),
    ]);

    const total = await db.pricingSurvey.count();
    const invitesPending = await db.pricingSurveyInvite.count({
      where: { dismissed: false },
    });

    return NextResponse.json({
      responses,
      stats,
      total,
      invitesPending,
    });
  } catch (error) {
    console.error('Admin pricing survey error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
