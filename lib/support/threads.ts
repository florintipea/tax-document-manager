import { db } from '@/lib/db/client';
import { buildWelcomeMessage } from '@/lib/support/chatbot';
import { createAdminNotification } from '@/lib/support/notifications';

export async function ensureWelcomeSupportThread(input: {
  userId: string;
  guestEmail?: string;
  testerEmail?: string;
  loginUrl?: string;
  assignedToName?: string;
}): Promise<{ threadId: string; created: boolean }> {
  const existing = await db.supportThread.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (existing) {
    return { threadId: existing.id, created: false };
  }

  const welcome = buildWelcomeMessage({
    testerEmail: input.testerEmail,
    loginUrl: input.loginUrl,
    assignedToName: input.assignedToName,
  });

  const thread = await db.supportThread.create({
    data: {
      userId: input.userId,
      guestEmail: input.guestEmail?.toLowerCase(),
      subject: 'Beta-Willkommen',
      status: 'open',
      chatbotActive: true,
      lastMessageAt: new Date(),
      messages: {
        create: {
          senderType: 'bot',
          body: welcome,
        },
      },
    },
    select: { id: true },
  });

  return { threadId: thread.id, created: true };
}

export async function escalateThread(input: {
  threadId: string;
  userMessage: string;
  userLabel?: string;
}) {
  const now = new Date();
  await db.supportThread.update({
    where: { id: input.threadId },
    data: {
      status: 'escalated',
      escalatedAt: now,
      chatbotActive: false,
      lastMessageAt: now,
    },
  });

  await createAdminNotification({
    type: 'support_escalation',
    title: 'Kunde braucht Hilfe',
    body: `${input.userLabel || 'Nutzer'}: ${input.userMessage.slice(0, 180)}`,
    link: `/admin/support?thread=${input.threadId}`,
    metadata: { threadId: input.threadId },
  });
}

export async function notifyAdminNewUserMessage(input: {
  threadId: string;
  preview: string;
  userLabel?: string;
}) {
  await createAdminNotification({
    type: 'support_message',
    title: 'Neue Support-Nachricht',
    body: `${input.userLabel || 'Nutzer'}: ${input.preview.slice(0, 180)}`,
    link: `/admin/support?thread=${input.threadId}`,
    metadata: { threadId: input.threadId },
  });
}

/**
 * Admin-initiated outreach: open existing thread for a user or create one,
 * optionally posting the first admin message (proactive, without user escalation).
 */
export async function adminOpenOrCreateThreadForUser(input: {
  userId: string;
  adminId: string;
  body?: string;
  subject?: string;
}): Promise<{
  threadId: string;
  created: boolean;
  messageCreated: boolean;
}> {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      betaInvite: { select: { assignedToEmail: true, assignedToName: true } },
    },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  if (user.role === 'admin' || user.role === 'super_admin') {
    throw new Error('TARGET_IS_ADMIN');
  }

  let thread = await db.supportThread.findFirst({
    where: { userId: input.userId },
    orderBy: { lastMessageAt: 'desc' },
  });

  let created = false;
  if (!thread) {
    thread = await db.supportThread.create({
      data: {
        userId: input.userId,
        guestEmail: user.betaInvite?.assignedToEmail?.toLowerCase(),
        subject: input.subject?.trim() || 'Nachricht vom TaxDoc-Team',
        status: 'open',
        chatbotActive: false,
        lastMessageAt: new Date(),
      },
    });
    created = true;
  }

  const body = input.body?.trim();
  if (!body) {
    return { threadId: thread.id, created, messageCreated: false };
  }

  const now = new Date();
  await db.supportMessage.create({
    data: {
      threadId: thread.id,
      senderType: 'admin',
      senderId: input.adminId,
      body,
    },
  });

  await db.supportThread.update({
    where: { id: thread.id },
    data: {
      lastMessageAt: now,
      chatbotActive: false,
      status: 'waiting_user',
      subject: thread.subject || input.subject?.trim() || 'Nachricht vom TaxDoc-Team',
    },
  });

  return { threadId: thread.id, created, messageCreated: true };
}

/** Clear user unread when they open the support chat (status waiting_user → open). */
export async function markThreadReadByUser(threadId: string) {
  const thread = await db.supportThread.findUnique({
    where: { id: threadId },
    select: { status: true },
  });
  if (!thread || thread.status !== 'waiting_user') return;
  await db.supportThread.update({
    where: { id: threadId },
    data: { status: 'open' },
  });
}
