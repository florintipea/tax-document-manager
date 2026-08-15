import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { MARKET_PRICING, resolveMarket, type MarketCode } from '@/lib/billing/market-pricing';
import { PLAN_PRICING } from '@/lib/billing/plans';
import {
  applyDiscountToAmount,
  resolveDiscountForUser,
  discountSummaryDe,
} from '@/lib/billing/discounts';

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  const code = request.nextUrl.searchParams.get('code');
  const market = resolveMarket(request.nextUrl.searchParams.get('market'));

  const discount = await resolveDiscountForUser({
    userId,
    promoCode: code,
  });

  const config = MARKET_PRICING[market as MarketCode];
  const tiers = (['starter', 'pro', 'advisor'] as const).map((tier) => {
    const base =
      tier === 'starter'
        ? config.tiers.starter.amount
        : tier === 'pro'
          ? config.tiers.pro.amount
          : config.tiers.advisor.amount;
    const priced = applyDiscountToAmount(base, discount);
    const updates =
      tier === 'starter'
        ? config.tiers.starter.updatesYearly
        : tier === 'pro'
          ? config.tiers.pro.updatesYearly
          : config.tiers.advisor.updatesYearly;
    return {
      tier,
      currency: config.currency,
      original: priced.original,
      final: priced.final,
      saved: priced.saved,
      updatesYearly: updates ?? null,
    };
  });

  // EUR checkout amounts (canonical) also discounted for billing UI
  const eur = {
    starter: applyDiscountToAmount(PLAN_PRICING.starter.license, discount),
    standard: applyDiscountToAmount(PLAN_PRICING.standard.license, discount),
    advisor: applyDiscountToAmount(PLAN_PRICING.advisor.license, discount),
  };

  return NextResponse.json({
    market,
    discount,
    summary: discountSummaryDe(discount),
    tiers,
    eur,
    authenticated: Boolean(userId),
  });
}
