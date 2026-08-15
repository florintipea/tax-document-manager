import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { requireSessionUserId } from '@/lib/auth/session';
import { getBotReply } from '@/lib/support/chatbot';
import {
  ensureWelcomeSupportThread,
  escalateThread,
  markThreadReadByUser,
  notifyAdminNewUserMessage,
} from '@/lib/support/threads';

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let thread = await db.supportThread.findFirst({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    });

    if (!thread) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, betaInvite: true },
      });
      const ensured = await ensureWelcomeSupportThread({
        userId,
        guestEmail: user?.betaInvite?.assignedToEmail,
        testerEmail: user?.email || undefined,
        assignedToName: user?.name || user?.betaInvite?.assignedToName || undefined,
      });
      thread = await db.supportThread.findUnique({
        where: { id: ensured.threadId },
        include: {
          messages: { orderBy: { createdAt: 'asc' }, take: 100 },
        },
      });
    }

    // Opening the chat clears the unread badge (admin proactive messages)
    if (thread?.status === 'waiting_user') {
      await markThreadReadByUser(thread.id);
      thread = { ...thread, status: 'open' };
    }

    return NextResponse.json({ thread });
  } catch (error) {
    console.error('Support thread GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const postSchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Nachricht.' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, betaInvite: true },
    });

    let thread = await db.supportThread.findFirst({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!thread) {
      const ensured = await ensureWelcomeSupportThread({
        userId,
        guestEmail: user?.betaInvite?.assignedToEmail,
        testerEmail: user?.email || undefined,
        assignedToName: user?.name || undefined,
      });
      thread = await db.supportThread.findUniqueOrThrow({
        where: { id: ensured.threadId },
      });
    }

    const now = new Date();
    const userMessage = await db.supportMessage.create({
      data: {
        threadId: thread.id,
        senderType: 'user',
        senderId: userId,
        body: parsed.data.body.trim(),
      },
    });

    await db.supportThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: now,
        status: thread.status === 'resolved' ? 'open' : thread.status,
      },
    });

    const label =
      user?.name ||
      user?.betaInvite?.assignedToEmail ||
      user?.email ||
      'Tester';

    const botActive = thread.chatbotActive && thread.status !== 'escalated';
    let botMessage = null;

    if (botActive) {
      const { reply, escalate } = getBotReply(parsed.data.body);
      botMessage = await db.supportMessage.create({
        data: {
          threadId: thread.id,
          senderType: 'bot',
          body: reply,
        },
      });

      if (escalate) {
        await escalateThread({
          threadId: thread.id,
          userMessage: parsed.data.body,
          userLabel: label,
        });
      } else {
        // FAQ handled by bot — no admin noise
        await db.supportThread.update({
          where: { id: thread.id },
          data: { lastMessageAt: new Date() },
        });
      }
    } else {
      // Human handoff active — notify admin
      await notifyAdminNewUserMessage({
        threadId: thread.id,
        preview: parsed.data.body,
        userLabel: label,
      });
      await db.supportThread.update({
        where: { id: thread.id },
        data: {
          status: thread.status === 'escalated' ? 'escalated' : 'waiting_admin',
          lastMessageAt: new Date(),
        },
      });
    }

    const updated = await db.supportThread.findUnique({
      where: { id: thread.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    });

    return NextResponse.json({
      thread: updated,
      userMessage,
      botMessage,
    });
  } catch (error) {
    console.error('Support thread POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
