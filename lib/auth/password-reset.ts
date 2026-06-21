import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/client';

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function createResetToken(): string {
  return crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
}

export function getResetUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
  return `${base}/auth/reset-password?token=${token}`;
}

async function invalidateUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
  await db.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;

  const token = createResetToken();
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
  await db.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  });

  return token;
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const record = await db.verificationToken.findUnique({ where: { token } });

  if (!record) {
    return { ok: false, error: 'Invalid or expired reset link' };
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return { ok: false, error: 'Reset link has expired. Please request a new one.' };
  }

  const user = await db.user.findUnique({
    where: { email: record.identifier },
    select: { id: true },
  });

  if (!user) {
    return { ok: false, error: 'Invalid or expired reset link' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await invalidateUserSessions(user.id);
  await db.verificationToken.delete({ where: { token } });

  try {
    await db.securityEvent.create({
      data: {
        userId: user.id,
        type: 'password_reset',
        severity: 'medium',
        description: 'Password reset completed',
        ipAddress: 'unknown',
        userAgent: 'unknown',
      },
    });
  } catch {
    // Non-blocking
  }

  return { ok: true, email: record.identifier };
}

export async function setUserPassword(email: string, newPassword: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return false;

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await invalidateUserSessions(user.id);

  return true;
}
