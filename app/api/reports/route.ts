import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { detectPlatform } from '@/lib/reports/helpers';

const createReportSchema = z.object({
  type: z.enum(['feedback', 'error', 'bug']),
  title: z.string().max(200).optional(),
  message: z.string().min(3).max(10000),
  pageUrl: z.string().max(2000).optional(),
  stackTrace: z.string().max(20000).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createReportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent');
    const { type, title, message, pageUrl, stackTrace, severity, metadata } =
      validated.data;

    const report = await db.testReport.create({
      data: {
        userId,
        type,
        title: title || null,
        message,
        pageUrl: pageUrl || null,
        stackTrace: stackTrace || null,
        severity:
          severity ||
          (type === 'error' ? 'high' : type === 'bug' ? 'medium' : 'low'),
        userAgent,
        platform: detectPlatform(userAgent),
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: 'open',
      },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ report, message: 'Report submitted' }, { status: 201 });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
