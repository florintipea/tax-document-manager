import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getUserTierFeatures, type TierFeatures } from './features';
import type { TaxCountryCode } from '@/lib/tax/country-config';
import { hasUserOwnedAIKeys } from '@/lib/ai/user-providers';

export async function requireTierFeatures(userId: string): Promise<TierFeatures> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return getUserTierFeatures(userId, user?.role);
}

export function tierError(code: string, message: string, upgradeTier?: string) {
  return NextResponse.json(
    { error: message, code, upgradeTier },
    { status: 403 }
  );
}

export async function checkDocumentUploadAllowed(userId: string): Promise<
  | { allowed: true; features: TierFeatures }
  | { allowed: false; response: NextResponse }
> {
  const features = await requireTierFeatures(userId);
  if (features.maxDocuments === null) {
    return { allowed: true, features };
  }

  const count = await db.document.count({ where: { userId } });
  if (count >= features.maxDocuments) {
    return {
      allowed: false,
      response: tierError(
        'DOCUMENT_LIMIT',
        `Document limit reached (${features.maxDocuments}). Upgrade to Standard for unlimited storage.`,
        'standard'
      ),
    };
  }

  return { allowed: true, features };
}

export async function checkAiMessageAllowed(userId: string): Promise<
  | { allowed: true; features: TierFeatures }
  | { allowed: false; response: NextResponse }
> {
  const features = await requireTierFeatures(userId);

  // Bring-your-own keys always power chat — plan limits only apply to server-provided AI.
  if (await hasUserOwnedAIKeys(userId)) {
    return { allowed: true, features };
  }

  if (features.aiMessagesPerMonth === null) {
    return { allowed: true, features };
  }
  if (features.aiMessagesPerMonth === 0) {
    return {
      allowed: false,
      response: tierError(
        'AI_NOT_INCLUDED',
        'AI assistant is not included in your plan. Connect your own API key under Settings → AI Providers, or upgrade to Standard.',
        'standard'
      ),
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const used = await db.aIInteraction.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });

  if (used >= features.aiMessagesPerMonth) {
    return {
      allowed: false,
      response: tierError(
        'AI_LIMIT',
        `Monthly AI message limit reached (${features.aiMessagesPerMonth}). Connect your own API key or upgrade to Standard.`,
        'standard'
      ),
    };
  }

  return { allowed: true, features };
}

export function validateCalculatorAccess(
  features: TierFeatures,
  country: TaxCountryCode,
  options: {
    crossBorder?: { enabled?: boolean };
    rental?: { enabled?: boolean };
    deFilingMode?: string;
    vorauszahlungen?: unknown;
  }
): NextResponse | null {
  if (features.calculatorCountries === 'DE_ONLY' && country !== 'DE') {
    return tierError(
      'CALCULATOR_COUNTRY',
      'Your plan includes the German calculator only. Upgrade to Standard for all countries.',
      'standard'
    );
  }

  if (!features.calculatorFullDe && country === 'DE') {
    if (options.crossBorder?.enabled) {
      return tierError(
        'CALCULATOR_FEATURE',
        'Cross-border calculation requires Standard or higher.',
        'standard'
      );
    }
    if (options.rental?.enabled) {
      return tierError(
        'CALCULATOR_FEATURE',
        'Rental income calculation requires Standard or higher.',
        'standard'
      );
    }
    if (options.deFilingMode === 'zusammen') {
      return tierError(
        'CALCULATOR_FEATURE',
        'Joint filing (Zusammenveranlagung) requires Standard or higher.',
        'standard'
      );
    }
    if (options.vorauszahlungen) {
      return tierError(
        'CALCULATOR_FEATURE',
        'Vorauszahlungen require Standard or higher.',
        'standard'
      );
    }
  }

  return null;
}
