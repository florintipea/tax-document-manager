import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  decryptTotpSecret,
  getClientIp,
  verifyTotpCode,
} from '@/lib/auth/two-factor';
import { logTwoFactorEvent } from '@/lib/auth/two-factor-events';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rate-limit';

const disableSchema = z.object({
  password: z.string().min(8),
  code: z.string().min(6).max(16),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(ip, RateLimitPresets.twoFactorVerify);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = disableSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Two-factor authentication is not enabled' }, { status: 400 });
    }

    const passwordValid = await bcrypt.compare(validated.data.password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const secret = decryptTotpSecret(user.twoFactorSecret);
    if (!verifyTotpCode(secret, user.email, validated.data.code)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: '[]',
      },
    });

    await logTwoFactorEvent(userId, '2fa_disabled', 'Two-factor authentication disabled', 'medium', getClientIp(request));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
