import { NextRequest, NextResponse } from 'next/server';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';
import {
  generateWeeklyReport,
  getLatestWeeklyReport,
} from '@/lib/admin/weekly-report';

function cronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.ADMIN_CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  if (header === `Bearer ${secret}`) return true;
  const q = request.nextUrl.searchParams.get('secret');
  return q === secret;
}

/** GET — latest stored weekly report (admin session). */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session && !cronAuthorized(request)) return adminUnauthorized();

  const latest = await getLatestWeeklyReport();
  if (!latest) {
    return NextResponse.json({ report: null });
  }

  let payload = null;
  try {
    payload = JSON.parse(latest.payloadJson);
  } catch {
    payload = null;
  }

  return NextResponse.json({
    report: {
      id: latest.id,
      title: latest.title,
      periodStart: latest.periodStart,
      periodEnd: latest.periodEnd,
      trigger: latest.trigger,
      summary: latest.summary,
      createdAt: latest.createdAt,
      payload,
    },
  });
}

/**
 * POST — generate digest now.
 * Auth: admin session OR Authorization: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  const isCron = cronAuthorized(request);
  if (!session && !isCron) return adminUnauthorized();

  const trigger = isCron && !session ? 'cron' : 'manual';
  const payload = await generateWeeklyReport(trigger);

  return NextResponse.json({ ok: true, payload }, { status: 201 });
}
