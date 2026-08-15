import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { requireSessionUserId } from '@/lib/auth/session';

/**
 * Lightweight unread check for the Hilfe widget badge.
 * Does not create threads — unread when status is waiting_user (admin wrote).
 */
export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thread = await db.supportThread.findFirst({
      where: { userId, status: 'waiting_user' },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true },
    });

    const unread = Boolean(thread);
    return NextResponse.json({
      unread,
      count: unread ? 1 : 0,
      threadId: thread?.id ?? null,
    });
  } catch (error) {
    console.error('Support unread GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
