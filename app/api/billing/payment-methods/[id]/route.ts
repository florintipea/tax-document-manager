import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const method = await db.paymentMethod.findFirst({
      where: { id, userId },
    });

    if (!method) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    const updated = await db.paymentMethod.update({
      where: { id, userId },
      data: { isDefault: true },
    });

    return NextResponse.json({ paymentMethod: updated });
  } catch (error) {
    console.error('Set default payment method error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const method = await db.paymentMethod.findFirst({
      where: { id, userId },
    });

    if (!method) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.paymentMethod.delete({ where: { id, userId } });

    if (method.isDefault) {
      const next = await db.paymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await db.paymentMethod.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
