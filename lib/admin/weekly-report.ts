/**
 * Weekly admin digest — live KPI snapshot for founder only.
 */

import { db } from '@/lib/db/client';
import { createAdminNotification } from '@/lib/support/notifications';

export type WeeklyKpis = {
  usersTotal: number;
  usersWeek: number;
  loginsWeek: number;
  docsWeek: number;
  betaVisitsWeek: number;
  betaRequestsWeek: number;
  openThreads: number;
  escalatedWeek: number;
  openReports: number;
  reportsWeek: number;
  activePromos: number;
  activeUserDiscounts: number;
  discountsCreatedWeek: number;
  subscriptionsActive: number;
};

export type WeeklyReportPayload = {
  periodStart: string;
  periodEnd: string;
  timezone: string;
  kpis: WeeklyKpis;
  highlights: string[];
  generatedAt: string;
  trigger: 'manual' | 'cron';
};

function weekWindow(now = new Date()): { start: Date; end: Date } {
  const end = now;
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function collectWeeklyKpis(now = new Date()): Promise<{
  kpis: WeeklyKpis;
  start: Date;
  end: Date;
}> {
  const { start, end } = weekWindow(now);

  const [
    usersTotal,
    usersWeek,
    loginsWeek,
    docsWeek,
    betaVisitsWeek,
    betaRequestsWeek,
    openThreads,
    escalatedWeek,
    openReports,
    reportsWeek,
    activePromos,
    activeUserDiscounts,
    discountsCreatedWeek,
    subscriptionsActive,
  ] = await Promise.all([
    db.user.count({ where: { role: 'user' } }),
    db.user.count({ where: { role: 'user', createdAt: { gte: start } } }),
    db.user.count({ where: { lastLoginAt: { gte: start } } }),
    db.document.count({ where: { createdAt: { gte: start } } }),
    db.betaVisitEvent.count({ where: { createdAt: { gte: start } } }).catch(() => 0),
    db.betaInvite.count({ where: { assignedAt: { gte: start } } }),
    db.supportThread
      .count({ where: { status: { in: ['open', 'waiting_admin', 'waiting_user'] } } })
      .catch(() => 0),
    db.supportThread
      .count({ where: { status: 'escalated', escalatedAt: { gte: start } } })
      .catch(() => 0),
    db.testReport.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    db.testReport.count({ where: { createdAt: { gte: start } } }),
    db.promoCampaign
      .count({
        where: { active: true, startsAt: { lte: end }, endsAt: { gte: end } },
      })
      .catch(() => 0),
    db.userDiscount
      .count({
        where: {
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: end } }],
        },
      })
      .catch(() => 0),
    db.userDiscount.count({ where: { createdAt: { gte: start } } }).catch(() => 0),
    db.subscription.count({ where: { status: 'active' } }),
  ]);

  return {
    start,
    end,
    kpis: {
      usersTotal,
      usersWeek,
      loginsWeek,
      docsWeek,
      betaVisitsWeek,
      betaRequestsWeek,
      openThreads,
      escalatedWeek,
      openReports,
      reportsWeek,
      activePromos,
      activeUserDiscounts,
      discountsCreatedWeek,
      subscriptionsActive,
    },
  };
}

export function buildHighlights(kpis: WeeklyKpis): string[] {
  const h: string[] = [];
  h.push(
    `Nutzer: ${kpis.usersTotal} gesamt · +${kpis.usersWeek} neu · ${kpis.loginsWeek} Logins (7T)`
  );
  h.push(
    `Beta: ${kpis.betaVisitsWeek} Besuche · ${kpis.betaRequestsWeek} Anfragen · ${kpis.docsWeek} neue Docs`
  );
  h.push(
    `Support: ${kpis.openThreads} offen · ${kpis.escalatedWeek} Eskalationen (7T)`
  );
  h.push(
    `Qualität: ${kpis.openReports} offene Reports · ${kpis.reportsWeek} neu (7T)`
  );
  h.push(
    `Preise: ${kpis.activePromos} Promos · ${kpis.activeUserDiscounts} Nutzer-Rabatte · ${kpis.discountsCreatedWeek} neu`
  );
  if (kpis.escalatedWeek > 0) {
    h.push(`⚠ ${kpis.escalatedWeek} Eskalationen — Support priorisieren.`);
  }
  if (kpis.betaVisitsWeek > 5 && kpis.betaRequestsWeek === 0) {
    h.push('⚠ Besuche ohne Anfragen — Funnel/CTA prüfen.');
  }
  if (kpis.openReports > 5) {
    h.push('⚠ Viele offene Reports — Triage im Admin-Hub.');
  }
  return h;
}

export async function generateWeeklyReport(
  trigger: 'manual' | 'cron' = 'manual'
): Promise<WeeklyReportPayload> {
  const now = new Date();
  const { kpis, start, end } = await collectWeeklyKpis(now);
  const highlights = buildHighlights(kpis);

  const payload: WeeklyReportPayload = {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    timezone: 'Europe/Berlin',
    kpis,
    highlights,
    generatedAt: now.toISOString(),
    trigger,
  };

  const title = `Wochenbericht ${new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)}`;

  const body = highlights.join('\n');

  const report = await db.weeklyAdminReport.create({
    data: {
      title,
      periodStart: start,
      periodEnd: end,
      trigger,
      payloadJson: JSON.stringify(payload),
      summary: body.slice(0, 2000),
    },
  });

  await createAdminNotification({
    type: 'weekly_digest',
    title,
    body: highlights.slice(0, 4).join(' · '),
    link: '/admin',
    metadata: { reportId: report.id, trigger },
  });

  // Optional email if SMTP configured (MVP: skip if missing)
  await maybeEmailAdmin(title, body).catch(() => undefined);

  return payload;
}

async function maybeEmailAdmin(subject: string, text: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return;

  // SMTP optional — nodemailer is not a hard dependency. Log intent for ops.
  console.info(
    `[weekly-report] SMTP configured but nodemailer not bundled; in-app notification only. Subject: ${subject}`
  );
  void text;
}

export async function getLatestWeeklyReport() {
  return db.weeklyAdminReport.findFirst({
    orderBy: { createdAt: 'desc' },
  });
}
