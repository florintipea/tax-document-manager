import { NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { buildFinanceOverview } from '@/lib/dashboard/finance-overview';

/**
 * Dashboard finance charts — reads persisted User Steuerprofil + calculatorDraft
 * and related tables from SQLite (DATA_DIR). Never invents figures; never uses
 * client-only session state for amounts.
 */
export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 4;

    const [user, taxLines, rentals, grenzgaenger, documents] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          country: true,
          steuerklasse: true,
          deFilingMode: true,
          spouseIncome: true,
          calculatorDraft: true,
          vorname: true,
          nachname: true,
          steuernummer: true,
          hasRentalIncome: true,
          isCrossBorder: true,
          numberOfChildren: true,
        },
      }),
      db.taxLineEntry.findMany({
        where: { userId, year: { gte: minYear } },
        select: {
          year: true,
          kind: true,
          amount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.rentalYearEntry.findMany({
        where: { userId, year: { gte: minYear } },
        select: {
          year: true,
          grossRent: true,
          operatingCosts: true,
          werbungskosten: true,
          afaAmount: true,
        },
      }),
      db.grenzgaengerYearEntry.findMany({
        where: { userId, year: { gte: minYear } },
        select: {
          year: true,
          enabled: true,
          foreignEmploymentIncome: true,
          foreignWithholdingTax: true,
        },
      }),
      db.document.findMany({
        where: { userId, year: { gte: minYear } },
        select: {
          year: true,
          date: true,
          taxAmount: true,
          isTaxRelevant: true,
          taxCategory: true,
        },
        take: 500,
        orderBy: { date: 'desc' },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const overview = buildFinanceOverview({
      currentYear,
      user,
      taxLines,
      rentals,
      grenzgaenger,
      documents,
    });

    return NextResponse.json({ overview });
  } catch (error) {
    console.error('Dashboard finance GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
