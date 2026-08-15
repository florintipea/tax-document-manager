import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { verifyPassword } from '@/lib/security/encryption';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rate-limit';
import { getUserUploadDir } from '@/lib/utils/documents';

const deleteSchema = z.object({
  password: z.string().min(1),
  confirm: z.literal('DELETE'),
});

/**
 * GDPR Art. 17 — delete account and associated files.
 * Requires password + explicit confirm token.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const limited = await checkRateLimit(`${userId}:${ip}`, {
      ...RateLimitPresets.passwordReset,
      keyPrefix: 'ratelimit:gdpr-delete',
      maxRequests: 5,
    });
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            'Confirmation required: send password and confirm: "DELETE"',
        },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const uploadDir = getUserUploadDir(userId);
    if (existsSync(uploadDir)) {
      await rm(uploadDir, { recursive: true, force: true });
    }

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({
      message: 'Account deleted',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
