import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { serializeDocumentIds } from '@/lib/tax/elster-preview';
import { yearFromSearchParams } from '@/lib/tax/elster-data';

const schema = z.object({
  propertyId: z.string().optional().nullable(),
  year: z.number().int().min(2000).max(2100),
  objectLabel: z.string().max(200).optional().nullable(),
  grossRent: z.number().min(0).default(0),
  operatingCosts: z.number().min(0).default(0),
  werbungskosten: z.number().min(0).default(0),
  afaAmount: z.number().min(0).optional().nullable(),
  afaRate: z.number().min(0).max(100).optional().nullable(),
  buildingValue: z.number().min(0).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  documentIds: z.array(z.string()).optional().default([]),
  needsReview: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const year = yearFromSearchParams(request.nextUrl.searchParams.get('year'));
    const rentals = await db.rentalYearEntry.findMany({
      where: { userId, ...(year ? { year } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ rentals });
  } catch (error) {
    console.error('Rental GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const data = parsed.data;
    const rental = await db.rentalYearEntry.create({
      data: {
        userId,
        propertyId: data.propertyId ?? null,
        year: data.year,
        objectLabel: data.objectLabel ?? null,
        grossRent: data.grossRent,
        operatingCosts: data.operatingCosts,
        werbungskosten: data.werbungskosten,
        afaAmount: data.afaAmount ?? null,
        afaRate: data.afaRate ?? null,
        buildingValue: data.buildingValue ?? null,
        notes: data.notes ?? null,
        documentIds: serializeDocumentIds(data.documentIds),
        needsReview: data.needsReview,
      },
    });
    await db.user.update({
      where: { id: userId },
      data: { hasRentalIncome: true },
    });
    return NextResponse.json({ rental }, { status: 201 });
  } catch (error) {
    console.error('Rental POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const existing = await db.rentalYearEntry.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.rentalYearEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Rental DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
