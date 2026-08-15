import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  percentOff: z.number().min(0).max(100).nullable().optional(),
  amountOff: z.number().min(0).max(10000).nullable().optional(),
  code: z.string().max(40).nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  active: z.boolean().optional(),
  note: z.string().max(500).nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const session = await getAdminSession();
  if (!session) return adminUnauthorized();

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const data = parsed.data;
  const campaign = await db.promoCampaign.update({
    where: { id },
    data: {
      ...(data.name != null ? { name: data.name } : {}),
      ...(data.percentOff !== undefined ? { percentOff: data.percentOff } : {}),
      ...(data.amountOff !== undefined ? { amountOff: data.amountOff } : {}),
      ...(data.code !== undefined
        ? { code: data.code?.trim() ? data.code.trim().toUpperCase() : null }
        : {}),
      ...(data.startsAt ? { startsAt: new Date(data.startsAt) } : {}),
      ...(data.endsAt ? { endsAt: new Date(data.endsAt) } : {}),
      ...(data.active != null ? { active: data.active } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
    },
  });

  return NextResponse.json({ campaign });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await getAdminSession();
  if (!session) return adminUnauthorized();

  const { id } = await ctx.params;
  await db.promoCampaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
