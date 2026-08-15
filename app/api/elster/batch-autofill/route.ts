import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { runBatchAutofill } from '@/lib/tax/batch-autofill';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { uploadLimits } from '@/lib/utils/upload-limits';

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  mode: z.enum(['unsorted', 'year', 'ids']).default('unsorted'),
  /**
   * Per-request payload safety only — not a product Obergrenze.
   * Clients send large batches in packets; server processes docs sequentially.
   */
  documentIds: z
    .array(z.string().min(1))
    .max(uploadLimits.batchAutofillRequestMax)
    .optional(),
  reanalyze: z.boolean().optional().default(true),
  applyTaxLines: z.boolean().optional().default(true),
  applyCalculator: z.boolean().optional().default(true),
  applyProfileRefresh: z.boolean().optional().default(true),
  applyImmobilien: z.boolean().optional().default(true),
  applyHausgeld: z.boolean().optional().default(true),
});

/**
 * Batch Beleg → ELSTER-Vorbereitung + Steuerrechner + Immobilien/Hausgeld.
 * No Mein-ELSTER / ERiC submit.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await checkRateLimit(userId, {
      windowMs: 60 * 1000,
      maxRequests: 8,
      keyPrefix: 'ratelimit:elster-batch',
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error:
            'Zu viele Batch-Anfragen. Bitte kurz warten und erneut versuchen.',
        },
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

    const {
      year,
      mode,
      documentIds,
      reanalyze,
      applyTaxLines,
      applyCalculator,
      applyProfileRefresh,
      applyImmobilien,
      applyHausgeld,
    } = parsed.data;
    if (mode === 'ids' && (!documentIds || documentIds.length === 0)) {
      return NextResponse.json(
        { error: 'documentIds erforderlich für mode=ids' },
        { status: 400 }
      );
    }

    const result = await runBatchAutofill({
      userId,
      year,
      mode,
      documentIds,
      reanalyze,
      applyTaxLines,
      applyCalculator,
      applyProfileRefresh,
      applyImmobilien,
      applyHausgeld,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error('ELSTER batch-autofill error:', error);
    return NextResponse.json(
      { error: 'Batch-Verarbeitung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
