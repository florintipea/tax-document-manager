import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPricingSurveyStatus } from '@/lib/test-phase/survey';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getPricingSurveyStatus(session.user.id, session.user.email);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Pricing survey status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
