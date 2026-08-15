import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { calculateCountryTax, createDefaultDeductions } from '@/lib/tax/calculator';
import {
  normalizeCalculatorCountry,
  SUPPORTED_CALCULATOR_COUNTRIES,
  type DeductionId,
  type Steuerklasse,
} from '@/lib/tax/country-config';
import { z } from 'zod';
import { requireTierFeatures, validateCalculatorAccess } from '@/lib/billing/guards';

const deductionSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  amount: z.number().min(0),
});

const vorauszahlungSchema = z.object({
  q1: z.number().min(0).optional().default(0),
  q2: z.number().min(0).optional().default(0),
  q3: z.number().min(0).optional().default(0),
  q4: z.number().min(0).optional().default(0),
});

const crossBorderSchema = z.object({
  enabled: z.boolean(),
  workCountry: z.string().optional().default('AT'),
  residenceCountry: z.string().optional().default('DE'),
  foreignTaxPaid: z.number().min(0).optional().default(0),
  foreignIncome: z.number().min(0).optional(),
});

const rentalSchema = z.object({
  enabled: z.boolean(),
  grossRent: z.number().min(0).optional().default(0),
  operatingCosts: z.number().min(0).optional().default(0),
  buildingValue: z.number().min(0).optional(),
  afaRate: z.number().min(0).max(100).optional(),
  useFlatExpensePercent: z.boolean().optional(),
  flatExpensePercent: z.number().min(0).max(100).optional(),
});

const calculateSchema = z.object({
  country: z.enum(['DE', 'US', 'CA', 'RO', 'ES', 'GR', 'AT', 'CH']),
  income: z.number().min(0),
  taxWithheld: z.number().min(0).optional().default(0),
  filingStatus: z.enum(['single', 'married', 'headOfHousehold']).optional(),
  caProvince: z.enum(['ON', 'BC', 'AB', 'OTHER']).optional(),
  steuerklasse: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI']).optional(),
  deFilingMode: z.enum(['einzel', 'zusammen']).optional(),
  spouseIncome: z.number().min(0).optional(),
  spouseTaxWithheld: z.number().min(0).optional(),
  spouseDeductions: z.array(deductionSchema).optional(),
  deductions: z.array(deductionSchema).optional(),
  vorauszahlungen: vorauszahlungSchema.optional(),
  crossBorder: crossBorderSchema.optional(),
  rental: rentalSchema.optional(),
  year: z.number().int().min(2020).max(2030),
});

export async function GET() {
  return NextResponse.json({
    supportedCountries: SUPPORTED_CALCULATOR_COUNTRIES,
  });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(userId, {
      windowMs: 60 * 1000,
      maxRequests: 20,
      keyPrefix: 'ratelimit:tax-calculate',
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const validated = calculateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const {
      country,
      income,
      taxWithheld,
      filingStatus,
      caProvince,
      steuerklasse,
      deFilingMode,
      spouseIncome,
      spouseTaxWithheld,
      spouseDeductions,
      deductions,
      vorauszahlungen,
      crossBorder,
      rental,
      year,
    } = validated.data;

    const features = await requireTierFeatures(userId);
    const accessError = validateCalculatorAccess(features, country, {
      crossBorder,
      rental,
      deFilingMode,
      vorauszahlungen,
    });
    if (accessError) return accessError;

    const normalizedCountry = normalizeCalculatorCountry(country);
    const defaultDeductions = createDefaultDeductions(normalizedCountry);
    const mergedDeductions =
      deductions ??
      defaultDeductions.map((d) => ({
        id: d.id as DeductionId,
        enabled: d.enabled,
        amount: d.amount,
      }));

    const result = calculateCountryTax({
      country: normalizedCountry,
      income,
      taxWithheld: taxWithheld ?? 0,
      filingStatus,
      caProvince,
      steuerklasse: steuerklasse as Steuerklasse | undefined,
      deFilingMode,
      spouseIncome,
      spouseTaxWithheld,
      spouseDeductions: spouseDeductions?.map((d) => ({
        id: d.id as DeductionId,
        enabled: d.enabled,
        amount: d.amount,
      })),
      deductions: mergedDeductions.map((d) => ({
        id: d.id as DeductionId,
        enabled: d.enabled,
        amount: d.amount,
      })),
      vorauszahlungen,
      crossBorder,
      rental,
      year,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
