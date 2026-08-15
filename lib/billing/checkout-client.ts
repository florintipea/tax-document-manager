import type { PlanId, PlanTier, PurchaseType } from '@/lib/billing/plans';
import { toPlanId } from '@/lib/billing/plans';

export interface CheckoutResult {
  ok: boolean;
  redirecting?: boolean;
  error?: string;
}

export async function startCheckout(
  tier: PlanTier,
  purchaseType: PurchaseType
): Promise<CheckoutResult> {
  const planId: PlanId = toPlanId(tier, purchaseType);

  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: data.error || 'Checkout failed' };
  }

  if (data.mode === 'live' && data.checkoutUrl) {
    window.location.href = data.checkoutUrl;
    return { ok: true, redirecting: true };
  }

  return { ok: false, error: data.error || data.message || 'Checkout failed' };
}
