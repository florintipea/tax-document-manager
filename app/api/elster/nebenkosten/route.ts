import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { serializeDocumentIds } from '@/lib/tax/elster-preview';
import { yearFromSearchParams } from '@/lib/tax/elster-data';

const schema = z.object({
  propertyId: z.string().optional().nullable(),
  year: z.number().int().min(2000).max(2100),
  settlementAmount: z.number().min(0),
  isNachzahlung: z.boolean().default(true),
  objectLabel: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  documentIds: z.array(z.string()).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const year = yearFromSearchParams(request.nextUrl.searchParams.get('year'));
    const nebenkosten = await db.nebenkostenAbrechnung.findMany({
      where: { userId, ...(year ? { year } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ nebenkosten });
  } catch (error) {
    console.error('Nebenkosten GET error:', error);
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
    const row = await db.nebenkostenAbrechnung.create({
      data: {
        userId,
        propertyId: data.propertyId ?? null,
        year: data.year,
        settlementAmount: data.settlementAmount,
        isNachzahlung: data.isNachzahlung,
        objectLabel: data.objectLabel ?? null,
        notes: data.notes ?? null,
        documentIds: serializeDocumentIds(data.documentIds),
      },
    });
    return NextResponse.json({ nebenkosten: row }, { status: 201 });
  } catch (error) {
    console.error('Nebenkosten POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const existing = await db.nebenkostenAbrechnung.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.nebenkostenAbrechnung.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Nebenkosten DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
