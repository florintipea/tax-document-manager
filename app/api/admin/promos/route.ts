import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

const upsertSchema = z.object({
  name: z.string().min(2).max(120),
  percentOff: z.number().min(0).max(100).nullable().optional(),
  amountOff: z.number().min(0).max(10000).nullable().optional(),
  code: z.string().max(40).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  active: z.boolean().optional().default(true),
  note: z.string().max(500).nullable().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return adminUnauthorized();

  const campaigns = await db.promoCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return adminUnauthorized();

  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const data = parsed.data;
  if (!data.percentOff && !data.amountOff) {
    return NextResponse.json(
      { error: 'percentOff oder amountOff erforderlich' },
      { status: 400 }
    );
  }
  if (new Date(data.endsAt) <= new Date(data.startsAt)) {
    return NextResponse.json({ error: 'endsAt muss nach startsAt liegen' }, { status: 400 });
  }

  const code = data.code?.trim() ? data.code.trim().toUpperCase() : null;

  const campaign = await db.promoCampaign.create({
    data: {
      name: data.name,
      percentOff: data.percentOff ?? null,
      amountOff: data.amountOff ?? null,
      code,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      active: data.active,
      note: data.note ?? null,
      createdById: session.user!.id,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
