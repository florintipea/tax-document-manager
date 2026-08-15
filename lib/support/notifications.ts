import { createHash } from 'crypto';
import { db } from '@/lib/db/client';

export type AdminNotificationType =
  | 'beta_visit'
  | 'beta_request'
  | 'support_escalation'
  | 'support_message'
  | 'weekly_digest';

export async function createAdminNotification(input: {
  type: AdminNotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  return db.adminNotification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
  });
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || process.env.NEXTAUTH_SECRET || 'taxdoc-beta';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/** Dedup window: same visitor + path within this many ms → no second notification */
const VISIT_DEDUP_MS = 5 * 60 * 1000;

export async function recordBetaVisit(input: {
  path: string;
  ip?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  userAgent?: string;
  notify?: boolean;
  notificationTitle?: string;
  notificationBody?: string;
  notificationType?: AdminNotificationType;
}) {
  const ipHash = input.ip && input.ip !== 'unknown' ? hashIp(input.ip) : undefined;
  const path = input.path.slice(0, 200);

  const since = new Date(Date.now() - VISIT_DEDUP_MS);
  const orFilters: Array<{ ipHash?: string; sessionId?: string }> = [];
  if (ipHash) orFilters.push({ ipHash });
  if (input.sessionId) orFilters.push({ sessionId: input.sessionId });

  const recent =
    orFilters.length > 0
      ? await db.betaVisitEvent.findFirst({
          where: {
            path,
            createdAt: { gte: since },
            OR: orFilters,
          },
          select: { id: true },
        })
      : null;

  if (recent) {
    return { recorded: false as const, deduped: true as const };
  }

  const event = await db.betaVisitEvent.create({
    data: {
      path,
      ipHash,
      sessionId: input.sessionId?.slice(0, 64),
      utmSource: input.utmSource?.slice(0, 100),
      utmMedium: input.utmMedium?.slice(0, 100),
      utmCampaign: input.utmCampaign?.slice(0, 100),
      userAgent: input.userAgent?.slice(0, 300),
    },
  });

  if (input.notify !== false) {
    await createAdminNotification({
      type: input.notificationType || 'beta_visit',
      title: input.notificationTitle || 'Neuer Beta-Besuch',
      body: input.notificationBody || `Jemand hat ${path} geöffnet.`,
      link: '/admin/support',
      metadata: {
        path,
        eventId: event.id,
        utmSource: input.utmSource,
        utmCampaign: input.utmCampaign,
      },
    });
  }

  return { recorded: true as const, deduped: false as const, eventId: event.id };
}
