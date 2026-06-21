import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200);

    const where: {
      status?: string;
      type?: string;
    } = {};

    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.type = type;

    const [reports, openCount] = await Promise.all([
      db.testReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      db.testReport.count({ where: { status: 'open' } }),
    ]);

    return NextResponse.json({ reports, openCount });
  } catch (error) {
    console.error('List admin reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
