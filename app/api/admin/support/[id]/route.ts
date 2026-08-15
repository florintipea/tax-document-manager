import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const { id } = await context.params;
    const thread = await db.supportThread.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' }, take: 200 },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ thread });
  } catch (error) {
    console.error('Admin support thread GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
