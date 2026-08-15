import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';
import { adminOpenOrCreateThreadForUser } from '@/lib/support/threads';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

    const where =
      status && status !== 'all'
        ? { status }
        : {};

    const threads = await db.supportThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const escalatedCount = await db.supportThread.count({
      where: { status: 'escalated' },
    });

    return NextResponse.json({ threads, escalatedCount });
  } catch (error) {
    console.error('Admin support list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const replySchema = z.object({
  threadId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  body: z.string().min(1).max(4000).optional(),
  resolve: z.boolean().optional(),
  subject: z.string().max(200).optional(),
}).refine((d) => Boolean(d.threadId || d.userId), {
  message: 'threadId oder userId erforderlich',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return adminUnauthorized();

    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 });
    }

    const adminId = session.user!.id;

    // Proactive outreach: open/create thread by userId (optional first message)
    if (parsed.data.userId && !parsed.data.threadId) {
      try {
        const result = await adminOpenOrCreateThreadForUser({
          userId: parsed.data.userId,
          adminId,
          body: parsed.data.body,
          subject: parsed.data.subject,
        });

        const thread = await db.supportThread.findUnique({
          where: { id: result.threadId },
          include: {
            user: { select: { id: true, email: true, name: true } },
            messages: { orderBy: { createdAt: 'asc' }, take: 200 },
          },
        });

        return NextResponse.json({
          thread,
          created: result.created,
          messageCreated: result.messageCreated,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'USER_NOT_FOUND') {
          return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 });
        }
        if (msg === 'TARGET_IS_ADMIN') {
          return NextResponse.json(
            { error: 'Kein Chat mit Admin-Konten.' },
            { status: 400 }
          );
        }
        throw e;
      }
    }

    if (!parsed.data.threadId || !parsed.data.body?.trim()) {
      return NextResponse.json(
        { error: 'threadId und Nachricht erforderlich.' },
        { status: 400 }
      );
    }

    const thread = await db.supportThread.findUnique({
      where: { id: parsed.data.threadId },
    });
    if (!thread) {
      return NextResponse.json({ error: 'Thread nicht gefunden.' }, { status: 404 });
    }

    const now = new Date();
    await db.supportMessage.create({
      data: {
        threadId: thread.id,
        senderType: 'admin',
        senderId: adminId,
        body: parsed.data.body.trim(),
      },
    });

    const updated = await db.supportThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: now,
        chatbotActive: false,
        status: parsed.data.resolve ? 'resolved' : 'waiting_user',
        escalatedAt: thread.escalatedAt,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' }, take: 200 },
      },
    });

    return NextResponse.json({ thread: updated });
  } catch (error) {
    console.error('Admin support reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
