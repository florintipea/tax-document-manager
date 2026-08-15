import { NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  ensureDefaultCategories,
  getDefaultCategoriesForCountry,
} from '@/lib/tax/default-categories';

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    const country = user?.country || 'US';
    await ensureDefaultCategories(db, country);

    const defaultNames = getDefaultCategoriesForCountry(country).map((c) => c.name);

    const categories = await db.documentCategory.findMany({
      where: {
        userId: null,
        name: { in: defaultNames },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories, country });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
