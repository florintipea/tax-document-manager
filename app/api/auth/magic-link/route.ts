import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp } from '@/lib/security/client-ip';
import {
  createRawMagicToken,
  storeMagicLinkToken,
  trySendMagicLinkEmail,
} from '@/lib/auth/magic-link';

const schema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  from: z.string().max(64).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    const rate = await checkRateLimit(ip, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 8,
      keyPrefix: 'ratelimit:magic-link',
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige E-Mail' }, { status: 400 });
    }

    const { email } = parsed.data;
    const raw = createRawMagicToken();
    await storeMagicLinkToken(email, raw);

    const base =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://taxdoc-beta.onrender.com';
    const link = `${base.replace(/\/$/, '')}/auth/magic?email=${encodeURIComponent(email)}&token=${encodeURIComponent(raw)}`;

    const send = await trySendMagicLinkEmail(email, link);
    const showDev =
      process.env.MAGIC_LINK_SHOW_URL === 'true' ||
      process.env.NODE_ENV !== 'production' ||
      !send.sent;

    return NextResponse.json({
      ok: true,
      message: send.sent
        ? 'Magic Link gesendet — bitte E-Mail prüfen.'
        : 'Magic Link erstellt. Wenn keine E-Mail ankommt (SMTP fehlt), nutze den angezeigten Link oder klassische Registrierung.',
      sent: send.sent,
      ...(showDev ? { devLink: link } : {}),
    });
  } catch (error) {
    console.error('[magic-link]', error);
    return NextResponse.json({ error: 'Magic Link fehlgeschlagen' }, { status: 500 });
  }
}
