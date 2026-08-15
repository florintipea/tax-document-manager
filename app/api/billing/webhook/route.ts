import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db/client';
import {
  licensePeriodEnd,
  updatesPeriodEnd,
  type PlanTier,
  type PurchaseType,
} from '@/lib/billing/plans';

const WEBHOOK_TOLERANCE_SECONDS = 300;

async function upsertSubscriptionFromStripe(data: {
  userId: string;
  tier: PlanTier;
  purchaseType: PurchaseType;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: Date;
}) {
  const isLicense = data.purchaseType === 'license';
  const periodEnd =
    data.currentPeriodEnd ??
    (isLicense ? licensePeriodEnd() : updatesPeriodEnd());

  const existing = await db.subscription.findUnique({
    where: { userId: data.userId },
    select: { planId: true, billingInterval: true },
  });

  const planId =
    existing?.billingInterval === 'license' && data.purchaseType === 'updates'
      ? existing.planId
      : data.tier;

  await db.subscription.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      planId: data.tier,
      billingInterval: data.purchaseType,
      steuerjahr: null,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      stripeCustomerId: data.stripeCustomerId ?? null,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      stripePriceId: data.stripePriceId ?? null,
    },
    update: {
      planId: data.purchaseType === 'license' ? data.tier : planId || data.tier,
      billingInterval: data.purchaseType,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      stripeCustomerId: data.stripeCustomerId ?? undefined,
      stripeSubscriptionId: data.stripeSubscriptionId ?? undefined,
      stripePriceId: data.stripePriceId ?? undefined,
    },
  });
}

function verifyWebhookEvent(
  body: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
    apiVersion: '2025-02-24.acacia',
  });

  return stripe.webhooks.constructEvent(
    body,
    signature,
    webhookSecret,
    WEBHOOK_TOLERANCE_SECONDS
  );
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== 'paid') {
        return NextResponse.json({ received: true, skipped: 'unpaid' });
      }

      const metadata = (session.metadata || {}) as Record<string, string>;
      const userId = metadata.userId;
      const tier = metadata.tier as PlanTier | undefined;
      const purchaseType = (metadata.purchaseType || metadata.billingInterval) as
        | PurchaseType
        | undefined;

      if (userId && tier && purchaseType) {
        await upsertSubscriptionFromStripe({
          userId,
          tier,
          purchaseType,
          stripeCustomerId:
            typeof session.customer === 'string' ? session.customer : session.customer?.id,
          stripeSubscriptionId:
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id,
        });
      }
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.created'
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const metadata = (sub.metadata || {}) as Record<string, string>;
      const userId = metadata.userId;
      const tier = metadata.tier as PlanTier | undefined;
      const purchaseType = (metadata.purchaseType || 'updates') as PurchaseType;

      if (userId && tier) {
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : undefined;

        await upsertSubscriptionFromStripe({
          userId,
          tier,
          purchaseType,
          stripeCustomerId:
            typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items?.data?.[0]?.price?.id,
          currentPeriodEnd: periodEnd,
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const metadata = (sub.metadata || {}) as Record<string, string>;
      const userId = metadata.userId;
      if (userId) {
        await db.subscription.updateMany({
          where: { userId, billingInterval: 'updates' },
          data: { status: 'canceled', cancelAtPeriodEnd: true },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
