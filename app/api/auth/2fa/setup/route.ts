import { NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  createTotpSecret,
  decryptTotpSecret,
  encryptTotpSecret,
  generateQrCodeDataUrl,
  getClientIp,
} from '@/lib/auth/two-factor';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(ip, RateLimitPresets.twoFactorVerify);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many setup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: 'Two-factor authentication is already enabled' }, { status: 400 });
    }

    const secret = createTotpSecret();
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptTotpSecret(secret),
        twoFactorEnabled: false,
        twoFactorBackupCodes: '[]',
      },
    });

    const qrCodeDataUrl = await generateQrCodeDataUrl(user.email, secret);

    return NextResponse.json({
      qrCodeDataUrl,
      secret,
      manualEntryKey: secret,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
