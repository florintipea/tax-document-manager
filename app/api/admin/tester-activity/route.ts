import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';
import { TESTER_EMAIL_DOMAIN } from '@/lib/test-phase/flags';
import {
  MAX_TESTER_COUNT,
  parseTesterSlot,
} from '@/lib/test-phase/tester-accounts';
import { getBetaSlotStats } from '@/lib/test-phase/beta-assign';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const domain = TESTER_EMAIL_DOMAIN.toLowerCase();
    const [users, slotStats] = await Promise.all([
      db.user.findMany({
      where: {
        AND: [
          { email: { endsWith: `@${domain}` } },
          { email: { startsWith: 'tester' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
        _count: {
          select: {
            documents: true,
            aiInteractions: true,
            testReports: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        betaInvite: {
          select: {
            assignedToEmail: true,
            assignedToName: true,
            assignedAt: true,
          },
        },
      },
    }),
      getBetaSlotStats(),
    ]);

    const testers = users
      .map((user) => {
        const slot = parseTesterSlot(user.email, domain);
        if (slot == null) return null;

        const documentCount = user._count.documents;
        const aiInteractionCount = user._count.aiInteractions;
        const testReportCount = user._count.testReports;
        const lastDocumentAt = user.documents[0]?.createdAt ?? null;
        const active =
          user.lastLoginAt != null ||
          documentCount > 0 ||
          aiInteractionCount > 0 ||
          testReportCount > 0;

        return {
          slot,
          email: user.email,
          name: user.name,
          lastLoginAt: user.lastLoginAt,
          documentCount,
          lastDocumentAt,
          aiInteractionCount,
          testReportCount,
          active,
          assigned: user.betaInvite != null,
          assignedToEmail: user.betaInvite?.assignedToEmail ?? null,
          assignedToName: user.betaInvite?.assignedToName ?? null,
          assignedAt: user.betaInvite?.assignedAt ?? null,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t != null)
      .sort((a, b) => a.slot - b.slot);

    const summary = {
      totalSlots: MAX_TESTER_COUNT,
      loggedInCount: testers.filter((t) => t.lastLoginAt != null).length,
      totalUploads: testers.reduce((sum, t) => sum + t.documentCount, 0),
      totalReports: testers.reduce((sum, t) => sum + t.testReportCount, 0),
      activeCount: testers.filter((t) => t.active).length,
      accountsCreated: testers.length,
      assignedCount: slotStats.assignedCount,
      freeSlots: slotStats.freeSlots,
    };

    return NextResponse.json({ testers, summary });
  } catch (error) {
    console.error('Tester activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
