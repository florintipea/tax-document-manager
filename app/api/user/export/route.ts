import { NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rate-limit';

/**
 * GDPR Art. 15 / 20 — export account data (no secrets).
 */
export async function GET(request: Request) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const limited = await checkRateLimit(`${userId}:${ip}`, {
      ...RateLimitPresets.api,
      keyPrefix: 'ratelimit:gdpr-export',
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        language: true,
        timezone: true,
        theme: true,
        twoFactorEnabled: true,
        numberOfChildren: true,
        deFilingMode: true,
        steuerklasse: true,
        bundesland: true,
        isCrossBorder: true,
        hasRentalIncome: true,
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
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        subscription: {
          select: {
            planId: true,
            status: true,
            billingInterval: true,
            steuerjahr: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            year: true,
            date: true,
            isTaxRelevant: true,
            taxAmount: true,
            taxCategory: true,
            tags: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            category: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        aiProviders: {
          select: {
            id: true,
            provider: true,
            label: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        paymentMethods: {
          select: {
            id: true,
            type: true,
            label: true,
            status: true,
            isDefault: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      format: 'taxdoc-gdpr-export-v1',
      notice:
        'Secrets (passwords, 2FA secrets, API keys, tokens) are excluded. Document binary files are not included — download them separately from Documents.',
      account: user,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="taxdoc-data-export-${userId.slice(0, 8)}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
