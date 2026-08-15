import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      usersTotal,
      usersWeek,
      docsTotal,
      betaVisitsWeek,
      betaRequestsWeek,
      openThreads,
      escalatedThreads,
      openReports,
      activePromos,
      activeUserDiscounts,
      pricingSurveys,
      subscriptionsActive,
    ] = await Promise.all([
      db.user.count({ where: { role: 'user' } }),
      db.user.count({ where: { role: 'user', createdAt: { gte: weekAgo } } }),
      db.document.count(),
      db.betaVisitEvent.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => 0),
      db.betaInvite.count({ where: { assignedAt: { gte: weekAgo } } }),
      db.supportThread.count({ where: { status: { in: ['open', 'waiting_admin', 'waiting_user'] } } }).catch(() => 0),
      db.supportThread.count({ where: { status: 'escalated' } }).catch(() => 0),
      db.testReport.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      db.promoCampaign.count({
        where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
      }),
      db.userDiscount.count({
        where: {
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      db.pricingSurvey.count(),
      db.subscription.count({ where: { status: 'active' } }),
    ]);

    const loginsDay = await db.user.count({
      where: { lastLoginAt: { gte: dayAgo } },
    });

    // Recently active testers / users (for proactive outreach from Admin Hub)
    const recentActive = await db.user.findMany({
      where: {
        role: 'user',
        OR: [
          { lastLoginAt: { gte: weekAgo } },
          {
            documents: { some: { createdAt: { gte: weekAgo } } },
          },
        ],
      },
      orderBy: [{ lastLoginAt: 'desc' }, { updatedAt: 'desc' }],
      take: 12,
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
        supportThreads: {
          orderBy: { lastMessageAt: 'desc' },
          take: 1,
          select: { id: true, status: true },
        },
        betaInvite: {
          select: { assignedToEmail: true, assignedToName: true },
        },
      },
    });

    const recentTesters = recentActive.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      lastLoginAt: u.lastLoginAt,
      displayName:
        u.name ||
        u.betaInvite?.assignedToName ||
        u.betaInvite?.assignedToEmail ||
        u.email,
      supportThreadId: u.supportThreads[0]?.id ?? null,
      supportStatus: u.supportThreads[0]?.status ?? null,
    }));

    return NextResponse.json({
      generatedAt: now.toISOString(),
      kpis: {
        usersTotal,
        usersWeek,
        loginsDay,
        docsTotal,
        betaVisitsWeek,
        betaRequestsWeek,
        openThreads,
        escalatedThreads,
        openReports,
        activePromos,
        activeUserDiscounts,
        pricingSurveys,
        subscriptionsActive,
      },
      recentTesters,
      links: {
        funnel: '/admin/beta-funnel',
        testers: '/admin/tester-activity',
        support: '/admin/support',
        reports: '/admin/reports',
        survey: '/admin/pricing-survey',
        pricing: '/admin/preise',
        preview: '/pricing?adminPreview=1',
      },
    });
  } catch (error) {
    console.error('admin insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
