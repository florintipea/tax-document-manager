import { NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';

export async function GET() {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await db.securityEvent.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 30,
    select: {
      id: true,
      type: true,
      severity: true,
      description: true,
      ipAddress: true,
      userAgent: true,
      timestamp: true,
    },
  });

  return NextResponse.json({ events });
}
