import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { applyCalculatorFromBelege } from '@/lib/tax/autofill-apply';
import { runBatchAutofill } from '@/lib/tax/batch-autofill';
import { checkRateLimit } from '@/lib/security/rate-limit';

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  /** If true, re-run batch mapping on year docs before calculator fill */
  runBatchFirst: z.boolean().optional().default(false),
  persist: z.boolean().optional().default(true),
});

/**
 * POST /api/tax/autofill-from-belege
 * Steuerprofil + Belege/TaxLines → Steuerrechner-Draft (KI-Vorschlag).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await checkRateLimit(userId, {
      windowMs: 60 * 1000,
      maxRequests: 12,
      keyPrefix: 'ratelimit:tax-calc-autofill',
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte kurz warten.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Ungültige Anfrage' },
        { status: 400 }
      );
    }

    const { year, runBatchFirst, persist } = parsed.data;

    let batchSummary = null;
    if (runBatchFirst) {
      const batch = await runBatchAutofill({
        userId,
        year,
        mode: 'year',
        // Mapping-only first pass — full PDF re-read spikes Starter RAM.
        reanalyze: false,
        applyTaxLines: true,
        applyCalculator: false,
        applyProfileRefresh: true,
        applyImmobilien: true,
        applyHausgeld: true,
      });
      batchSummary = batch.summary;
    }

    const draft = await applyCalculatorFromBelege({
      userId,
      year,
      persist,
    });

    return NextResponse.json({
      ok: true,
      year,
      draft,
      batchSummary,
      disclaimerDe: draft.disclaimerDe,
    });
  } catch (error) {
    console.error('tax autofill-from-belege error:', error);
    return NextResponse.json(
      { error: 'Steuerrechner-Autofill fehlgeschlagen' },
      { status: 500 }
    );
  }
}
