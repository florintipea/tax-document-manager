import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/admin';
import { getRateLimitBackend } from '@/lib/security/rate-limit';
import { isTrustCloudflareEnabled } from '@/lib/security/client-ip';
import {
  assessPersistence,
  probeDataDirWritable,
} from '@/lib/db/persistence';
import { getDataDir } from '@/lib/utils/paths';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function hasCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.ADMIN_CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return Boolean(match && match[1] === secret);
}

async function pingDatabase(): Promise<boolean> {
  try {
    const { db } = await import('@/lib/db/client');
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wantDetails =
    url.searchParams.get('admin') === '1' ||
    url.searchParams.get('deep') === '1';
  const cronAuthorized = hasCronSecret(request);
  const sessionAdmin = wantDetails ? await isAdmin() : false;
  const privileged = sessionAdmin || cronAuthorized;

  if (wantDetails && !privileged) {
    return NextResponse.json(
      { error: 'Forbidden' },
      {
        status: 403,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const dbOk = await pingDatabase();

  const dataDir = getDataDir();
  const diskConfigured = Boolean(process.env.DATA_DIR);
  const diskOk = diskConfigured ? probeDataDirWritable(dataDir) : true;

  const checks = {
    db: dbOk ? 'ok' : 'error',
    disk: diskConfigured ? (diskOk ? 'ok' : 'error') : 'skipped',
  };

  const ok = dbOk && diskOk;

  const payload: Record<string, unknown> = {
    ok,
    service: 'taxdoc',
    status: ok ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  };

  if (privileged) {
    const { getMemoryRateLimitSize } = await import('@/lib/security/rate-limit');
    const mem = process.memoryUsage();
    payload.security = {
      rateLimit: getRateLimitBackend(),
      redisConfigured: Boolean(process.env.REDIS_URL),
      trustCloudflare: isTrustCloudflareEnabled(),
      memoryRateLimitKeys: getMemoryRateLimitSize(),
    };
    payload.memory = {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
    };

    const persistence = assessPersistence();
    payload.persistence = {
      ok: persistence.ok,
      dataDir: persistence.dataDir,
      databaseOnDataDir: persistence.databaseOnDataDir,
      looksPersistent: persistence.looksPersistent,
      dedicatedMount: persistence.dedicatedMount,
      dataDirWritable: persistence.dataDirWritable,
      steuerprofilSafe: persistence.ok,
      warnings: persistence.warnings,
    };
  }

  return NextResponse.json(payload, {
    status: ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
