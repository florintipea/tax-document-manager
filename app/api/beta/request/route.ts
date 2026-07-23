import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  assignNextBetaSlot,
  BetaAssignError,
} from '@/lib/test-phase/beta-assign';
import { getClientIp } from '@/lib/security/client-ip';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { internalErrorResponse } from '@/lib/security/api-response';

const requestSchema = z.object({
  email: z
    .string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein.')
    .transform((v) => v.toLowerCase().trim()),
  name: z
    .string()
    .min(2, 'Bitte gib deinen Namen ein (mindestens 2 Zeichen).')
    .max(100)
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
      keyPrefix: 'ratelimit:beta-request',
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error:
            'Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: validated.error.issues[0]?.message || 'Ungültige Eingabe.',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    const result = await assignNextBetaSlot({
      assignedToEmail: validated.data.email,
      assignedToName: validated.data.name,
      assignedIp: ip,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof BetaAssignError) {
      const status =
        error.code === 'ALREADY_ASSIGNED'
          ? 409
          : error.code === 'NO_SLOTS' || error.code === 'TEST_PHASE_ENDED'
            ? 503
            : 400;

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }

    return internalErrorResponse('Beta request error:', error);
  }
}
