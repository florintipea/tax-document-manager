import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { serializeDocumentIds } from '@/lib/tax/elster-preview';
import { yearFromSearchParams } from '@/lib/tax/elster-data';
import { GRENZGAENGER_WORK_COUNTRIES } from '@/lib/tax/country-config';

const workCountries = GRENZGAENGER_WORK_COUNTRIES as readonly string[];

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  enabled: z.boolean().default(true),
  workCountry: z.string().min(2).max(2),
  residenceCountry: z.string().min(2).max(2).default('DE'),
  foreignEmploymentIncome: z.number().min(0).default(0),
  foreignWithholdingTax: z.number().min(0).default(0),
  commutingKmOneWay: z.number().min(0).optional().nullable(),
  commutingDays: z.number().int().min(0).max(366).optional().nullable(),
  socialInsuranceCountry: z.string().max(2).optional().nullable(),
  dbaMethodHint: z.enum(['freistellung', 'anrechnung', 'unbekannt']).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  documentIds: z.array(z.string()).optional().default([]),
  needsReview: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const year = yearFromSearchParams(request.nextUrl.searchParams.get('year'));
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isCrossBorder: true },
    });

    if (year) {
      const entry = await db.grenzgaengerYearEntry.findUnique({
        where: { userId_year: { userId, year } },
      });
      return NextResponse.json({
        entry,
        isCrossBorder: user?.isCrossBorder ?? false,
        workCountries: [...workCountries],
      });
    }

    const entries = await db.grenzgaengerYearEntry.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
    });
    return NextResponse.json({
      entries,
      isCrossBorder: user?.isCrossBorder ?? false,
      workCountries: [...workCountries],
    });
  } catch (error) {
    console.error('Grenzgänger GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const data = parsed.data;

    const entry = await db.grenzgaengerYearEntry.upsert({
      where: { userId_year: { userId, year: data.year } },
      create: {
        userId,
        year: data.year,
        enabled: data.enabled,
        workCountry: data.workCountry,
        residenceCountry: data.residenceCountry,
        foreignEmploymentIncome: data.foreignEmploymentIncome,
        foreignWithholdingTax: data.foreignWithholdingTax,
        commutingKmOneWay: data.commutingKmOneWay ?? null,
        commutingDays: data.commutingDays ?? null,
        socialInsuranceCountry: data.socialInsuranceCountry ?? null,
        dbaMethodHint: data.dbaMethodHint ?? null,
        notes: data.notes ?? null,
        documentIds: serializeDocumentIds(data.documentIds),
        needsReview: data.needsReview,
      },
      update: {
        enabled: data.enabled,
        workCountry: data.workCountry,
        residenceCountry: data.residenceCountry,
        foreignEmploymentIncome: data.foreignEmploymentIncome,
        foreignWithholdingTax: data.foreignWithholdingTax,
        commutingKmOneWay: data.commutingKmOneWay ?? null,
        commutingDays: data.commutingDays ?? null,
        socialInsuranceCountry: data.socialInsuranceCountry ?? null,
        dbaMethodHint: data.dbaMethodHint ?? null,
        notes: data.notes ?? null,
        documentIds: serializeDocumentIds(data.documentIds),
        needsReview: data.needsReview,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: { isCrossBorder: data.enabled },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Grenzgänger PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
