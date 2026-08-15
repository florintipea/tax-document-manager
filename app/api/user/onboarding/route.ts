import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { requireSessionUserId } from '@/lib/auth/session';

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { onboardingCompletedAt: true },
    });

    return NextResponse.json({
      completed: Boolean(user?.onboardingCompletedAt),
      completedAt: user?.onboardingCompletedAt ?? null,
    });
  } catch (error) {
    console.error('Onboarding GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
      select: { onboardingCompletedAt: true },
    });

    return NextResponse.json({
      completed: true,
      completedAt: user.onboardingCompletedAt,
    });
  } catch (error) {
    console.error('Onboarding POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
