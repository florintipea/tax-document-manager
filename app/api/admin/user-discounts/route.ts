import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

const createSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().min(1).optional(),
  percentOff: z.number().min(0).max(100).nullable().optional(),
  amountOff: z.number().min(0).max(10000).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  reason: z.string().max(300).nullable().optional(),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return adminUnauthorized();

  const discounts = await db.userDiscount.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });
  return NextResponse.json({ discounts });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return adminUnauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
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

  let userId = data.userId;
  if (!userId && data.email) {
    const user = await db.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 });
    }
    userId = user.id;
  }
  if (!userId) {
    return NextResponse.json({ error: 'email oder userId erforderlich' }, { status: 400 });
  }

  // Deactivate previous active discounts for this user (one active at a time)
  await db.userDiscount.updateMany({
    where: { userId, active: true },
    data: { active: false },
  });

  const discount = await db.userDiscount.create({
    data: {
      userId,
      percentOff: data.percentOff ?? null,
      amountOff: data.amountOff ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      reason: data.reason ?? null,
      createdByAdminId: session.user!.id,
      active: data.active,
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json({ discount }, { status: 201 });
}
