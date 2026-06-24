import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import {
  createTwoFactorLoginToken,
  decryptBackupCodeHashes,
  decryptTotpSecret,
  encryptBackupCodeHashes,
  getClientIp,
  verifyBackupCode,
  verifyPending2FAToken,
  verifyTotpCode,
} from '@/lib/auth/two-factor';
import { logTwoFactorEvent } from '@/lib/auth/two-factor-events';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rate-limit';

const verifySchema = z.object({
  pendingToken: z.string().min(10),
  code: z.string().min(6).max(16),
  useBackupCode: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(ip, RateLimitPresets.twoFactorVerify);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = verifySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const pending = verifyPending2FAToken(validated.data.pendingToken);
    if (!pending) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: pending.userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Two-factor authentication is not enabled' }, { status: 400 });
    }

    let verified = false;

    if (validated.data.useBackupCode) {
      const storedHashes = decryptBackupCodeHashes(user.twoFactorBackupCodes);
      const backupResult = await verifyBackupCode(validated.data.code, storedHashes);
      if (backupResult.valid) {
        verified = true;
        await db.user.update({
          where: { id: user.id },
          data: {
            twoFactorBackupCodes: encryptBackupCodeHashes(backupResult.remainingHashes),
          },
        });
        await logTwoFactorEvent(user.id, '2fa_backup_used', 'Backup code used during login', 'medium', ip);
      }
    } else {
      const secret = decryptTotpSecret(user.twoFactorSecret);
      verified = verifyTotpCode(secret, user.email, validated.data.code);
    }

    if (!verified) {
      await logTwoFactorEvent(user.id, '2fa_failed', 'Failed 2FA verification during login', 'high', ip);
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await logTwoFactorEvent(user.id, 'login', 'Successful login with 2FA', 'low', ip);

    const loginToken = createTwoFactorLoginToken(user.id, pending.rememberMe);

    return NextResponse.json({
      success: true,
      loginToken,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
