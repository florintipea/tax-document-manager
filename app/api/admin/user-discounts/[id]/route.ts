import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

const patchSchema = z.object({
  percentOff: z.number().min(0).max(100).nullable().optional(),
  amountOff: z.number().min(0).max(10000).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  reason: z.string().max(300).nullable().optional(),
  active: z.boolean().optional(),
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
  const discount = await db.userDiscount.update({
    where: { id },
    data: {
      ...(data.percentOff !== undefined ? { percentOff: data.percentOff } : {}),
      ...(data.amountOff !== undefined ? { amountOff: data.amountOff } : {}),
      ...(data.expiresAt !== undefined
        ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
        : {}),
      ...(data.reason !== undefined ? { reason: data.reason } : {}),
      ...(data.active != null ? { active: data.active } : {}),
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json({ discount });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await getAdminSession();
  if (!session) return adminUnauthorized();

  const { id } = await ctx.params;
  await db.userDiscount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
