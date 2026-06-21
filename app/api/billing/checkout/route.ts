import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { checkRateLimit } from '@/lib/security/rate-limit';
import {
  getStripePriceEnvKey,
  getStripePriceId,
  parsePlanId,
  PLAN_IDS,
  type PlanTier,
  type PurchaseType,
} from '@/lib/billing/plans';

const checkoutSchema = z.object({
  planId: z.enum(PLAN_IDS as [string, ...string[]]).optional(),
  tier: z.enum(['standard', 'advisor']).optional(),
  purchaseType: z.enum(['license', 'updates']).optional(),
  paymentType: z
    .enum(['paypal', 'google_pay', 'apple_pay', 'bank_account', 'card'])
    .optional(),
});

function resolveTierAndPurchase(
  data: z.infer<typeof checkoutSchema>
): { tier: PlanTier; purchaseType: PurchaseType } | null {
  if (data.planId) {
    return parsePlanId(data.planId);
  }
  if (data.tier && data.purchaseType) {
    return { tier: data.tier, purchaseType: data.purchaseType };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(userId, {
      windowMs: 60 * 1000,
      maxRequests: 10,
      keyPrefix: 'ratelimit:checkout',
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = checkoutSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { paymentType } = validated.data;
    const purchase = resolveTierAndPurchase(validated.data);
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (purchase) {
      const { tier, purchaseType } = purchase;

      if (!stripeKey) {
        return NextResponse.json(
          {
            error:
              'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_* environment variables.',
            code: 'STRIPE_NOT_CONFIGURED',
          },
          { status: 503 }
        );
      }

      const priceId = getStripePriceId(tier, purchaseType);

      if (!priceId) {
        const envVar = getStripePriceEnvKey(tier, purchaseType);
        return NextResponse.json(
          {
            error: `Missing ${envVar}. Create a Stripe price and set this environment variable.`,
            code: 'STRIPE_PRICE_MISSING',
            envVar,
          },
          { status: 503 }
        );
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, subscription: true },
      });

      const isLicense = purchaseType === 'license';
      const params = new URLSearchParams({
        mode: isLicense ? 'payment' : 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: `${appUrl}/settings/billing?success=1&tier=${tier}&purchase=${purchaseType}`,
        cancel_url: `${appUrl}/settings/billing?canceled=1`,
        customer_email: user?.email || '',
        'payment_method_types[0]': 'card',
        'metadata[userId]': userId,
        'metadata[tier]': tier,
        'metadata[purchaseType]': purchaseType,
        'metadata[planId]': `${tier}-${purchaseType}`,
      });

      if (!isLicense) {
        params.append('subscription_data[metadata][userId]', userId);
        params.append('subscription_data[metadata][tier]', tier);
        params.append('subscription_data[metadata][purchaseType]', purchaseType);
      }

      if (user?.subscription?.stripeCustomerId) {
        params.delete('customer_email');
        params.append('customer', user.subscription.stripeCustomerId);
      }

      if (paymentType === 'paypal') {
        params.append('payment_method_types[1]', 'paypal');
      }

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const session = await response.json();

      if (!response.ok) {
        console.error('Stripe checkout error:', session);
        return NextResponse.json(
          { error: session.error?.message || 'Checkout failed' },
          { status: 502 }
        );
      }

      return NextResponse.json({
        mode: 'live',
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    }

    if (paymentType) {
      const existing = await db.paymentMethod.findFirst({
        where: { userId, type: paymentType },
      });

      if (existing) {
        await db.paymentMethod.update({
          where: { id: existing.id },
          data: { status: 'pending' },
        });
      } else {
        const existingCount = await db.paymentMethod.count({ where: { userId } });
        await db.paymentMethod.create({
          data: {
            userId,
            type: paymentType,
            label: paymentType,
            status: 'pending',
            isDefault: existingCount === 0,
          },
        });
      }

      return NextResponse.json({
        mode: 'saved',
        message: 'Payment preference saved',
      });
    }

    return NextResponse.json(
      { error: 'Missing planId or tier/purchaseType' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
