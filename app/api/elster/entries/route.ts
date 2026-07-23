import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { serializeDocumentIds, TAX_LINE_CATEGORIES } from '@/lib/tax/elster-preview';
import { yearFromSearchParams } from '@/lib/tax/elster-data';

const categoryIds = TAX_LINE_CATEGORIES.map((c) => c.id) as [string, ...string[]];

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  kind: z.enum(['income', 'expense']),
  category: z.enum(categoryIds),
  label: z.string().max(200).optional().nullable(),
  amount: z.number(),
  notes: z.string().max(5000).optional().nullable(),
  documentIds: z.array(z.string()).optional().default([]),
  needsReview: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const year = yearFromSearchParams(request.nextUrl.searchParams.get('year'));
    const entries = await db.taxLineEntry.findMany({
      where: { userId, ...(year ? { year } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ entries, categories: TAX_LINE_CATEGORIES });
  } catch (error) {
    console.error('Tax lines GET error:', error);
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
    const entry = await db.taxLineEntry.create({
      data: {
        userId,
        year: data.year,
        kind: data.kind,
        category: data.category,
        label: data.label ?? null,
        amount: data.amount,
        notes: data.notes ?? null,
        documentIds: serializeDocumentIds(data.documentIds),
        needsReview: data.needsReview,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Tax lines POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const existing = await db.taxLineEntry.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.taxLineEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Tax lines DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
