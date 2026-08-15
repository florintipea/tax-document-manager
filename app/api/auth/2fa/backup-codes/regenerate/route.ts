import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  createBackupCodes,
  decryptTotpSecret,
  encryptBackupCodeHashes,
  getClientIp,
  hashBackupCodes,
  verifyTotpCode,
} from '@/lib/auth/two-factor';
import { logTwoFactorEvent } from '@/lib/auth/two-factor-events';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rate-limit';

const regenerateSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
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
    const validated = regenerateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Two-factor authentication is not enabled' }, { status: 400 });
    }

    const secret = decryptTotpSecret(user.twoFactorSecret);
    if (!verifyTotpCode(secret, user.email, validated.data.code)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const backupCodes = createBackupCodes();
    const hashedCodes = await hashBackupCodes(backupCodes);

    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: encryptBackupCodeHashes(hashedCodes),
      },
    });

    await logTwoFactorEvent(
      userId,
      '2fa_backup_regenerated',
      'Backup codes regenerated',
      'medium',
      getClientIp(request)
    );

    return NextResponse.json({
      success: true,
      backupCodes,
    });
  } catch (error) {
    console.error('2FA backup regenerate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
