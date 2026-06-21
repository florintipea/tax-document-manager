import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  ensureDefaultCategories,
  getSuggestedLanguageForCountry,
} from '@/lib/tax/default-categories';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  country: z.string().min(2).max(2).optional(),
  language: z.string().min(2).max(10).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  numberOfChildren: z.number().int().min(0).max(10).optional(),
  deFilingMode: z.enum(['einzel', 'zusammen']).optional(),
  spouseIncome: z.number().min(0).optional(),
  steuerklasse: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI']).optional(),
  bundesland: z.string().min(2).max(2).nullable().optional(),
  isCrossBorder: z.boolean().optional(),
  hasRentalIncome: z.boolean().optional(),
});

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        country: true,
        language: true,
        theme: true,
        numberOfChildren: true,
        deFilingMode: true,
        spouseIncome: true,
        steuerklasse: true,
        bundesland: true,
        isCrossBorder: true,
        hasRentalIncome: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ settings: user });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      const issue = validated.error.issues[0];
      const field = issue?.path?.join('.');
      const detail = issue?.message ?? 'Invalid request';
      return NextResponse.json(
        { error: field ? `${field}: ${detail}` : detail },
        { status: 400 }
      );
    }

    const data = { ...validated.data };

    if (data.country && !data.language) {
      data.language = getSuggestedLanguageForCountry(data.country);
    }

    const user = await db.user.update({
      where: { id: userId },
      data,
      select: {
        name: true,
        email: true,
        country: true,
        language: true,
        theme: true,
        numberOfChildren: true,
        deFilingMode: true,
        spouseIncome: true,
        steuerklasse: true,
        bundesland: true,
        isCrossBorder: true,
        hasRentalIncome: true,
        twoFactorEnabled: true,
      },
    });

    if (data.country) {
      await ensureDefaultCategories(db, data.country);
    }

    return NextResponse.json({
      message: 'Settings saved successfully',
      settings: user,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    const message =
      error instanceof Error && /no such column|does not exist/i.test(error.message)
        ? 'Tax profile could not be saved — database update required. Please try again after the next deploy.'
        : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
