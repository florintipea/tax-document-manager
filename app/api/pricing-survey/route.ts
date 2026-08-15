import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { getPricingSurveyStatus } from '@/lib/test-phase/survey';

const submitSchema = z.object({
  priceRange: z.enum(['under_20', '20_40', '40_60', '60_100', 'over_100', 'custom']),
  willingToPay: z.number().min(0).max(10000).optional(),
  planInterest: z.enum(['standard', 'advisor', 'unsure']).optional(),
  comment: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = submitSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const status = await getPricingSurveyStatus(session.user.id, session.user.email);
    if (!status.isBetaTester || !status.phaseEnded) {
      return NextResponse.json({ error: 'Survey not available' }, { status: 403 });
    }

    if (status.hasResponded) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
    }

    const { priceRange, willingToPay, planInterest, comment } = validated.data;

    if (priceRange === 'custom' && willingToPay === undefined) {
      return NextResponse.json({ error: 'Custom amount required' }, { status: 400 });
    }

    const survey = await db.pricingSurvey.create({
      data: {
        userId: session.user.id,
        priceRange,
        willingToPay: willingToPay ?? null,
        planInterest: planInterest ?? null,
        comment: comment ?? null,
      },
    });

    await db.pricingSurveyInvite.updateMany({
      where: { userId: session.user.id },
      data: { dismissed: true },
    });

    return NextResponse.json({ ok: true, id: survey.id });
  } catch (error) {
    console.error('Pricing survey submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
