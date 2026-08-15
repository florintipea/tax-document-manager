import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

type RangePreset = 1 | 7 | 30;

function toDateKey(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function startOfDayUtc(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function endOfDayUtc(dateKey: string): Date {
  return new Date(`${dateKey}T23:59:59.999Z`);
}

function resolveRange(searchParams: URLSearchParams): { start: Date; end: Date } {
  const presetRaw = searchParams.get('range');
  const preset =
    presetRaw === '1' || presetRaw === '7' || presetRaw === '30'
      ? (Number(presetRaw) as RangePreset)
      : 7;

  const now = new Date();
  const endKey = toDateKey(now);
  const end = endOfDayUtc(endKey);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (preset - 1));
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

function percent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const { start, end } = resolveRange(request.nextUrl.searchParams);

    const [adClicks, requests, firstLogins, docs, ai, reports] = await Promise.all([
      db.dailyAdClick.findMany({
        where: {
          dateKey: {
            gte: toDateKey(start),
            lte: toDateKey(end),
          },
        },
        orderBy: { dateKey: 'asc' },
      }),
      db.betaInvite.findMany({
        where: { assignedAt: { gte: start, lte: end } },
        select: { assignedAt: true, userId: true },
      }),
      db.user.findMany({
        where: {
          betaInvite: { isNot: null },
          lastLoginAt: { gte: start, lte: end },
        },
        select: { id: true, lastLoginAt: true },
      }),
      db.document.findMany({
        where: {
          user: { betaInvite: { isNot: null } },
          createdAt: { gte: start, lte: end },
        },
        select: { userId: true, createdAt: true },
      }),
      db.aIInteraction.findMany({
        where: {
          user: { betaInvite: { isNot: null } },
          createdAt: { gte: start, lte: end },
        },
        select: { userId: true, createdAt: true },
      }),
      db.testReport.findMany({
        where: {
          user: { betaInvite: { isNot: null } },
          createdAt: { gte: start, lte: end },
        },
        select: { userId: true, createdAt: true },
      }),
    ]);

    const dateRows = new Map<
      string,
      { dateKey: string; clicks: number; requests: number; assigned: number; firstLogins: number; active: number; userSet: Set<string> }
    >();

    const startDate = new Date(start);
    const endDate = new Date(end);
    for (let current = new Date(startDate); current <= endDate; current.setUTCDate(current.getUTCDate() + 1)) {
      const key = toDateKey(current);
      dateRows.set(key, {
        dateKey: key,
        clicks: 0,
        requests: 0,
        assigned: 0,
        firstLogins: 0,
        active: 0,
        userSet: new Set<string>(),
      });
    }

    for (const row of adClicks) {
      const target = dateRows.get(row.dateKey);
      if (target) target.clicks = row.clicks;
    }
    for (const row of requests) {
      const key = toDateKey(row.assignedAt);
      const target = dateRows.get(key);
      if (target) {
        target.requests += 1;
        target.assigned += 1;
      }
    }
    for (const row of firstLogins) {
      if (!row.lastLoginAt) continue;
      const key = toDateKey(row.lastLoginAt);
      const target = dateRows.get(key);
      if (target) {
        target.firstLogins += 1;
        target.userSet.add(row.id);
      }
    }

    const markActive = (items: Array<{ userId: string | null; createdAt: Date }>) => {
      for (const item of items) {
        if (!item.userId) continue;
        const key = toDateKey(item.createdAt);
        const target = dateRows.get(key);
        if (target) target.userSet.add(item.userId);
      }
    };
    markActive(docs);
    markActive(ai);
    markActive(reports);

    const daily = Array.from(dateRows.values())
      .map((row) => ({
        dateKey: row.dateKey,
        clicks: row.clicks,
        requests: row.requests,
        assigned: row.assigned,
        firstLogins: row.firstLogins,
        active: row.userSet.size,
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    const totals = daily.reduce(
      (acc, row) => {
        acc.clicks += row.clicks;
        acc.requests += row.requests;
        acc.assigned += row.assigned;
        acc.firstLogins += row.firstLogins;
        acc.active += row.active;
        return acc;
      },
      { clicks: 0, requests: 0, assigned: 0, firstLogins: 0, active: 0 }
    );

    return NextResponse.json({
      range: { start: toDateKey(start), end: toDateKey(end) },
      totals,
      conversion: {
        clickToRequest: percent(totals.requests, totals.clicks),
        requestToAssigned: percent(totals.assigned, totals.requests),
        assignedToActive: percent(totals.active, totals.assigned),
      },
      daily,
    });
  } catch (error) {
    console.error('Beta funnel GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const body = (await request.json()) as { dateKey?: string; clicks?: number };
    const dateKey = body.dateKey?.trim();
    const clicks = body.clicks;
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json({ error: 'Ungueltiges Datum.' }, { status: 400 });
    }
    if (!Number.isInteger(clicks) || (clicks ?? 0) < 0) {
      return NextResponse.json({ error: 'Ungueltige Klickzahl.' }, { status: 400 });
    }

    const row = await db.dailyAdClick.upsert({
      where: { dateKey },
      update: { clicks },
      create: { dateKey, clicks },
    });

    return NextResponse.json({ dateKey: row.dateKey, clicks: row.clicks });
  } catch (error) {
    console.error('Beta funnel POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
