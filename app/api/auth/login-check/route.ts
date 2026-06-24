import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { checkUserAppAccess } from '@/lib/test-phase/access';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rate-limit';
import { createPending2FAToken, getClientIp } from '@/lib/auth/two-factor';
import {
  formatLockoutMessage,
  formatRateLimitMessage,
  getAccountLockUntil,
  isAdminLoginEmail,
} from '@/lib/auth/login-lockout';
import { loginErrorResponse } from '@/lib/auth/login-errors';

const loginCheckSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8),
  remember: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const validated = loginCheckSchema.safeParse(body);
    if (!validated.success) {
      return loginErrorResponse('Ungültige E-Mail oder Passwort.', 'INVALID_INPUT', 400);
    }

    if (!isAdminLoginEmail(validated.data.email)) {
      const rateLimitResult = await checkRateLimit(
        `${validated.data.email}:${ip}`,
        RateLimitPresets.login
      );
      if (!rateLimitResult.allowed) {
        return loginErrorResponse(
          formatRateLimitMessage(rateLimitResult.resetTime),
          'RATE_LIMITED',
          429
        );
      }
    }

    const user = await db.user.findUnique({
      where: { email: validated.data.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        lockedUntil: true,
        failedLoginAttempts: true,
        twoFactorEnabled: true,
      },
    });

    if (!user?.passwordHash) {
      return loginErrorResponse('Ungültige E-Mail oder Passwort.', 'INVALID_CREDENTIALS', 401);
    }

    const isAdmin = isAdminLoginEmail(validated.data.email);

    if (user.lockedUntil && user.lockedUntil > new Date() && !isAdmin) {
      return loginErrorResponse(
        formatLockoutMessage(user.lockedUntil),
        'ACCOUNT_LOCKED',
        423
      );
    }

    const isValid = await bcrypt.compare(validated.data.password, user.passwordHash);
    if (!isValid) {
      if (!isAdmin) {
        const failedAttempts = user.failedLoginAttempts + 1;
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lockedUntil: getAccountLockUntil(failedAttempts),
          },
        });
      }
      return loginErrorResponse(
        'Ungültige E-Mail oder Passwort.',
        'INVALID_CREDENTIALS',
        401
      );
    }

    const access = await checkUserAppAccess(user.id, user.email, user.role);
    if (!access.allowed) {
      return loginErrorResponse(access.message, 'ACCESS_DENIED', 403);
    }

    if (user.twoFactorEnabled) {
      const pendingToken = createPending2FAToken(user.id, validated.data.remember ?? false);
      return NextResponse.json({
        requiresTwoFactor: true,
        pendingToken,
      });
    }

    return NextResponse.json({ requiresTwoFactor: false });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : String(error);
    console.error('Login check error:', detail, error);
    return loginErrorResponse('Serverfehler. Bitte in Kürze erneut versuchen.', 'SERVER_ERROR', 500);
  }
}
