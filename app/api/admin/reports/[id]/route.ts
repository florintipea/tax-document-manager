import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

const updateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  adminNotes: z.string().max(5000).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const existing = await db.testReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const { status, adminNotes, severity } = validated.data;
    const resolvedAt =
      status === 'resolved' || status === 'closed' ? new Date() : undefined;

    const report = await db.testReport.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(severity ? { severity } : {}),
        ...(resolvedAt ? { resolvedAt } : {}),
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Update admin report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const { id } = await params;
    const report = await db.testReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Get admin report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
