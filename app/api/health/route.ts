import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/admin';
import { getRateLimitBackend } from '@/lib/security/rate-limit';
import { isTrustCloudflareEnabled } from '@/lib/security/client-ip';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkDb = url.searchParams.get('db') === '1';
  const adminDetails = url.searchParams.get('admin') === '1';

  const payload: Record<string, unknown> = {
    ok: true,
    service: 'taxdoc',
    status: 'ready',
    timestamp: new Date().toISOString(),
  };

  if (adminDetails) {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        {
          status: 403,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    payload.security = {
      rateLimit: getRateLimitBackend(),
      redisConfigured: Boolean(process.env.REDIS_URL),
      trustCloudflare: isTrustCloudflareEnabled(),
    };
  }

  if (checkDb) {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        {
          status: 403,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    try {
      const { db } = await import('@/lib/db/client');
      await db.$queryRaw`SELECT 1`;
      payload.db = 'ok';
    } catch {
      payload.db = 'error';
      payload.ok = false;
      return NextResponse.json(payload, {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
