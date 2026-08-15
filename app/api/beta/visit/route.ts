import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp } from '@/lib/security/client-ip';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { recordBetaVisit } from '@/lib/support/notifications';

const schema = z.object({
  path: z.string().min(1).max(200),
  sessionId: z.string().max(64).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 20,
      keyPrefix: 'ratelimit:beta-visit',
    });
    if (!rate.allowed) {
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const path = parsed.data.path;
    const isRequestPage = path.includes('beta-anfrage');

    const result = await recordBetaVisit({
      path,
      ip,
      sessionId: parsed.data.sessionId,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      userAgent: request.headers.get('user-agent') || undefined,
      notificationTitle: isRequestPage ? 'Neuer Beta-Besuch' : 'Neuer Beta-Besuch',
      notificationBody: isRequestPage
        ? 'Jemand hat /beta-anfrage geöffnet.'
        : `Jemand hat ${path} geöffnet.`,
      notificationType: 'beta_visit',
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Beta visit track error:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
