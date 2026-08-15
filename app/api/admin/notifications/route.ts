import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === '1';
    const limit = Math.min(Number(searchParams.get('limit') || 30), 100);

    const where = unreadOnly ? { readAt: null } : {};

    const [notifications, unreadCount] = await Promise.all([
      db.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.adminNotification.count({ where: { readAt: null } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Admin notifications list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const patchSchema = z.object({
  ids: z.array(z.string()).min(1).max(100).optional(),
  markAll: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const now = new Date();
    if (parsed.data.markAll) {
      await db.adminNotification.updateMany({
        where: { readAt: null },
        data: { readAt: now },
      });
    } else if (parsed.data.ids?.length) {
      await db.adminNotification.updateMany({
        where: { id: { in: parsed.data.ids }, readAt: null },
        data: { readAt: now },
      });
    }

    const unreadCount = await db.adminNotification.count({ where: { readAt: null } });
    return NextResponse.json({ ok: true, unreadCount });
  } catch (error) {
    console.error('Admin notifications patch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
