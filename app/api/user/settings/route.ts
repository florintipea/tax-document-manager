import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  ensureDefaultCategories,
  getSuggestedLanguageForCountry,
} from '@/lib/tax/default-categories';
import {
  ANREDE_OPTIONS,
  RELIGION_OPTIONS,
  STEUERKLASSE_OPTIONS,
  emptyToNull,
  isPlausibleIdNr,
  normalizeIdNr,
} from '@/lib/tax/steuerprofil-fields';

const anredeSchema = z.enum(ANREDE_OPTIONS).nullable().optional();
const religionSchema = z.enum(RELIGION_OPTIONS).nullable().optional();
const steuerklasseOpt = z.enum(STEUERKLASSE_OPTIONS).nullable().optional();

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  country: z.string().min(2).max(2).optional(),
  language: z.string().min(2).max(10).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  numberOfChildren: z.number().int().min(0).max(10).optional(),
  deFilingMode: z.enum(['einzel', 'zusammen']).optional(),
  spouseIncome: z.number().min(0).optional(),
  steuerklasse: z.enum(STEUERKLASSE_OPTIONS).optional(),
  bundesland: z.string().min(2).max(2).nullable().optional(),
  isCrossBorder: z.boolean().optional(),
  hasRentalIncome: z.boolean().optional(),
  calculatorDraft: z.string().max(100_000).nullable().optional(),

  // Primary Steuerprofil
  anrede: anredeSchema,
  vorname: z.string().max(100).nullable().optional(),
  nachname: z.string().max(100).nullable().optional(),
  geburtsdatum: z.string().max(32).nullable().optional(),
  steuernummer: z.string().max(40).nullable().optional(),
  idNr: z.string().max(20).nullable().optional(),
  religion: religionSchema,
  street: z.string().max(200).nullable().optional(),
  zip: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  hasEmploymentIncome: z.boolean().optional(),
  hasSelfEmployment: z.boolean().optional(),
  hasCapitalIncome: z.boolean().optional(),

  // Partner / Ehepartner
  partnerAnrede: anredeSchema,
  partnerVorname: z.string().max(100).nullable().optional(),
  partnerNachname: z.string().max(100).nullable().optional(),
  partnerGeburtsdatum: z.string().max(32).nullable().optional(),
  partnerSteuernummer: z.string().max(40).nullable().optional(),
  partnerIdNr: z.string().max(20).nullable().optional(),
  partnerDifferentAddress: z.boolean().optional(),
  partnerStreet: z.string().max(200).nullable().optional(),
  partnerZip: z.string().max(20).nullable().optional(),
  partnerCity: z.string().max(100).nullable().optional(),
  partnerReligion: religionSchema,
  partnerSteuerklasse: steuerklasseOpt,
  partnerHasEmployment: z.boolean().optional(),
  partnerHasSelfEmployment: z.boolean().optional(),
  partnerHasCapitalIncome: z.boolean().optional(),
  partnerHasRentalIncome: z.boolean().optional(),
  partnerIsCrossBorder: z.boolean().optional(),
});

const settingsSelect = {
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
  calculatorDraft: true,
  twoFactorEnabled: true,
  anrede: true,
  vorname: true,
  nachname: true,
  geburtsdatum: true,
  steuernummer: true,
  idNr: true,
  religion: true,
  street: true,
  zip: true,
  city: true,
  hasEmploymentIncome: true,
  hasSelfEmployment: true,
  hasCapitalIncome: true,
  partnerAnrede: true,
  partnerVorname: true,
  partnerNachname: true,
  partnerGeburtsdatum: true,
  partnerSteuernummer: true,
  partnerIdNr: true,
  partnerDifferentAddress: true,
  partnerStreet: true,
  partnerZip: true,
  partnerCity: true,
  partnerReligion: true,
  partnerSteuerklasse: true,
  partnerHasEmployment: true,
  partnerHasSelfEmployment: true,
  partnerHasCapitalIncome: true,
  partnerHasRentalIncome: true,
  partnerIsCrossBorder: true,
} as const;

function normalizeTaxProfilePatch(
  data: z.infer<typeof updateSchema>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };

  const textNullKeys = [
    'vorname',
    'nachname',
    'geburtsdatum',
    'steuernummer',
    'street',
    'zip',
    'city',
    'partnerVorname',
    'partnerNachname',
    'partnerGeburtsdatum',
    'partnerSteuernummer',
    'partnerStreet',
    'partnerZip',
    'partnerCity',
  ] as const;

  for (const key of textNullKeys) {
    if (key in out) {
      out[key] = emptyToNull(out[key] as string | null | undefined);
    }
  }

  if ('idNr' in out) {
    out.idNr = normalizeIdNr(out.idNr as string | null | undefined);
  }
  if ('partnerIdNr' in out) {
    out.partnerIdNr = normalizeIdNr(out.partnerIdNr as string | null | undefined);
  }
  if ('anrede' in out && out.anrede === null) out.anrede = null;
  if ('religion' in out && out.religion === null) out.religion = null;
  if ('partnerAnrede' in out && out.partnerAnrede === null) out.partnerAnrede = null;
  if ('partnerReligion' in out && out.partnerReligion === null) {
    out.partnerReligion = null;
  }
  if ('partnerSteuerklasse' in out && out.partnerSteuerklasse === null) {
    out.partnerSteuerklasse = null;
  }

  return out;
}

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: settingsSelect,
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

    const data = normalizeTaxProfilePatch(validated.data);

    if (
      data.idNr != null &&
      typeof data.idNr === 'string' &&
      !isPlausibleIdNr(data.idNr)
    ) {
      return NextResponse.json(
        { error: 'idNr: Identifikationsnummer muss 11 Ziffern haben' },
        { status: 400 }
      );
    }
    if (
      data.partnerIdNr != null &&
      typeof data.partnerIdNr === 'string' &&
      !isPlausibleIdNr(data.partnerIdNr)
    ) {
      return NextResponse.json(
        { error: 'partnerIdNr: Identifikationsnummer muss 11 Ziffern haben' },
        { status: 400 }
      );
    }

    if (data.country && !data.language) {
      data.language = getSuggestedLanguageForCountry(data.country as string);
    }

    const user = await db.user.update({
      where: { id: userId },
      data,
      select: settingsSelect,
    });

    if (data.country) {
      await ensureDefaultCategories(db, data.country as string);
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
