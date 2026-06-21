import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { upsertUserAIProvider } from '@/lib/ai/user-providers';
import { verifySignedOAuthState } from '@/lib/security/oauth-state';

/**
 * Google OAuth callback — exchanges code for tokens when configured.
 * Falls back to settings with a message when OAuth is incomplete.
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  const settingsUrl = `${baseUrl}/settings/ai`;

  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(
      `${settingsUrl}?oauth=error&reason=${encodeURIComponent(error)}`
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?oauth=missing`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${settingsUrl}?oauth=not_configured`);
  }

  const session = await auth();
  const statePayload = state ? verifySignedOAuthState(state) : null;

  if (!statePayload) {
    return NextResponse.redirect(`${settingsUrl}?oauth=invalid_state`);
  }

  const userId = statePayload.userId;

  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.redirect(`${settingsUrl}?oauth=session_mismatch`);
  }

  const callbackUrl = `${baseUrl}/api/ai/oauth/google/callback`;

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
    };

    if (!tokenResponse.ok || !tokens.access_token) {
      return NextResponse.redirect(
        `${settingsUrl}?oauth=token_error&reason=${encodeURIComponent(tokens.error || 'exchange_failed')}`
      );
    }

    await upsertUserAIProvider(userId, {
      provider: 'google',
      connectionType: 'oauth',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });

    return NextResponse.redirect(`${settingsUrl}?oauth=success`);
  } catch {
    return NextResponse.redirect(`${settingsUrl}?oauth=failed`);
  }
}
