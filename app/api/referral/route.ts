import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getReferralStatus } from '@/lib/growth/referral';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getReferralStatus(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[referral]', error);
    return NextResponse.json({ error: 'Referral unavailable' }, { status: 500 });
  }
}
