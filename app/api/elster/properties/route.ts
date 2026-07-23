import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { serializeDocumentIds } from '@/lib/tax/elster-preview';

const schema = z.object({
  label: z.string().max(200).optional().nullable(),
  address: z.string().min(1).max(500),
  purchaseDate: z.string().datetime().optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  purchaseCosts: z.number().min(0).optional().nullable(),
  buildingValue: z.number().min(0).optional().nullable(),
  landValue: z.number().min(0).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  documentIds: z.array(z.string()).optional().default([]),
});

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const properties = await db.property.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Properties GET error:', error);
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
    const property = await db.property.create({
      data: {
        userId,
        label: data.label ?? null,
        address: data.address,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice ?? null,
        purchaseCosts: data.purchaseCosts ?? null,
        buildingValue: data.buildingValue ?? null,
        landValue: data.landValue ?? null,
        notes: data.notes ?? null,
        documentIds: serializeDocumentIds(data.documentIds),
      },
    });
    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Properties POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const id = z.string().min(1).parse(body.id);
    const parsed = schema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const existing = await db.property.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = parsed.data;
    const property = await db.property.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.purchaseDate !== undefined
          ? { purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }
          : {}),
        ...(data.purchasePrice !== undefined ? { purchasePrice: data.purchasePrice } : {}),
        ...(data.purchaseCosts !== undefined ? { purchaseCosts: data.purchaseCosts } : {}),
        ...(data.buildingValue !== undefined ? { buildingValue: data.buildingValue } : {}),
        ...(data.landValue !== undefined ? { landValue: data.landValue } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.documentIds !== undefined
          ? { documentIds: serializeDocumentIds(data.documentIds) }
          : {}),
      },
    });
    return NextResponse.json({ property });
  } catch (error) {
    console.error('Properties PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const existing = await db.property.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.property.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Properties DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
