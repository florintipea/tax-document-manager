import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import {
  loadElsterPreviewForUser,
  yearFromSearchParams,
} from '@/lib/tax/elster-data';
import { ensureDefaultCategories } from '@/lib/tax/default-categories';
import { db } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const year =
      yearFromSearchParams(request.nextUrl.searchParams.get('year')) ??
      new Date().getFullYear() - 1;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });
    if (user?.country) {
      await ensureDefaultCategories(db, user.country);
    }

    const preview = await loadElsterPreviewForUser(userId, year);
    if (!preview) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ preview });
  } catch (error) {
    console.error('ELSTER preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
