import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { adminUnauthorized, getAdminSession } from '@/lib/reports/helpers';

/**
 * Lightweight SSE stream for admin notification badges.
 * Polls DB every 8s — pragmatic MVP without Redis.
 */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return adminUnauthorized();

  const encoder = new TextEncoder();
  let closed = false;
  let interval: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    closed = true;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        if (closed) return;
        try {
          const unreadCount = await db.adminNotification.count({
            where: { readAt: null },
          });
          const escalatedCount = await db.supportThread.count({
            where: { status: 'escalated' },
          });
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ unreadCount, escalatedCount, ts: Date.now() })}\n\n`
            )
          );
        } catch {
          // ignore transient DB errors
        }
      };

      await send();
      interval = setInterval(() => {
        void send();
      }, 8000);

      const abort = () => {
        stop();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener('abort', abort);
    },
    cancel() {
      stop();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
