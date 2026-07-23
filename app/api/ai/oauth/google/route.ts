import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import { createSignedOAuthState } from '@/lib/security/oauth-state';

/**
 * Google OAuth for AI providers — architecture placeholder.
 * NotebookLM has no public third-party API; Gemini uses Google AI Studio API keys.
 * Full OAuth requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in env.
 */
export async function GET(request: NextRequest) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      available: false,
      mode: 'api_key_guided',
      message:
        'Google OAuth is not configured on this server. Connect Google AI (Gemini) using an API key from Google AI Studio.',
      setupUrl: 'https://aistudio.google.com/apikey',
      notebookLmNote:
        'NotebookLM cannot be connected by third-party apps — use notebooklm.google.com directly.',
      notebookLmUrl: 'https://notebooklm.google.com',
    });
  }

  const callbackUrl = `${baseUrl}/api/ai/oauth/google/callback`;
  const state = createSignedOAuthState(userId);
  const scope = encodeURIComponent('https://www.googleapis.com/auth/generative-language.retriever');
  const redirectUri = encodeURIComponent(callbackUrl);

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  return NextResponse.json({
    available: true,
    authUrl,
    mode: 'oauth',
    notebookLmNote:
      'NotebookLM has no public API for third-party apps. This OAuth connects Google AI (Gemini) only.',
    notebookLmUrl: 'https://notebooklm.google.com',
  });
}
