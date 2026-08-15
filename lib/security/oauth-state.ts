import crypto from 'crypto';

const STATE_TTL_MS = 10 * 60 * 1000;

function getStateSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for OAuth state signing');
  }
  return secret;
}

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', getStateSecret()).update(payload).digest('base64url');
}

export function createSignedOAuthState(userId: string): string {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifySignedOAuthState(
  state: string
): { userId: string } | null {
  const dot = state.lastIndexOf('.');
  if (dot <= 0) return null;

  const encoded = state.slice(0, dot);
  const signature = state.slice(dot + 1);
  const expected = signPayload(encoded);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      userId?: string;
      ts?: number;
    };
    if (!parsed.userId || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > STATE_TTL_MS) return null;
    return { userId: parsed.userId };
  } catch {
    return null;
  }
}
