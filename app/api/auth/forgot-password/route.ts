import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPasswordResetToken, getResetUrl } from '@/lib/auth/password-reset';
import { checkRateLimit } from '@/lib/security/rate-limit';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
      keyPrefix: 'ratelimit:password-reset',
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = forgotSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Invalid email' },
        { status: 400 }
      );
    }

    const token = await createPasswordResetToken(validated.data.email);

    const response: {
      message: string;
      resetUrl?: string;
    } = {
      message:
        'If an account exists for this email, password reset instructions have been sent.',
    };

    if (token && process.env.NODE_ENV === 'development') {
      const resetUrl = getResetUrl(token);
      response.resetUrl = resetUrl;
      console.log(`[dev] Password reset link for ${validated.data.email}: ${resetUrl}`);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
