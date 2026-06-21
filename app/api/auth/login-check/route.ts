import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { checkUserAppAccess } from '@/lib/test-phase/access';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rate-limit';
import { createPending2FAToken, getClientIp } from '@/lib/auth/two-factor';

const loginCheckSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8),
  remember: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(ip, RateLimitPresets.login);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = loginCheckSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: validated.data.email },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: `Account locked. Try again after ${user.lockedUntil.toLocaleString()}` },
        { status: 423 }
      );
    }

    const isValid = await bcrypt.compare(validated.data.password, user.passwordHash);
    if (!isValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil:
            failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const access = await checkUserAppAccess(user.id, user.email, user.role);
    if (!access.allowed) {
      return NextResponse.json({ error: access.message }, { status: 403 });
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
    console.error('Login check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
