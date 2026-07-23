import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { getUserTierFeatures } from '@/lib/billing/features';
import {
  PLAN_PRICING,
  PLAN_TIERS,
  defaultSteuerjahr,
  isSteuerjahrSeason,
  isStripeCheckoutConfigured,
} from '@/lib/billing/plans';

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const [subscription, paymentMethods, features] = await Promise.all([
      db.subscription.findUnique({ where: { userId } }),
      db.paymentMethod.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      }),
      getUserTierFeatures(userId, user?.role),
    ]);

    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
    const paypalConfigured = Boolean(process.env.PAYPAL_CLIENT_ID);

    return NextResponse.json({
      subscription,
      paymentMethods,
      features,
      pricing: {
        tiers: PLAN_TIERS.map((tier) => PLAN_PRICING[tier]),
        currency: 'EUR',
      },
      steuerjahr: {
        current: defaultSteuerjahr(),
        isSeason: isSteuerjahrSeason(),
      },
      providers: {
        stripe: stripeConfigured,
        stripeCheckout: isStripeCheckoutConfigured(),
        paypal: paypalConfigured,
      },
    });
  } catch (error) {
    console.error('Get billing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
