import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.pricingSurveyInvite.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, dismissed: true },
      update: { dismissed: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Pricing survey dismiss error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
