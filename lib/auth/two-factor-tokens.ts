import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for two-factor authentication');
  }
  return secret;
}

export function createPending2FAToken(userId: string, rememberMe: boolean): string {
  return jwt.sign(
    { userId, rememberMe, purpose: '2fa-pending' },
    getJwtSecret(),
    { expiresIn: '5m' }
  );
}

export function verifyPending2FAToken(
  token: string
): { userId: string; rememberMe: boolean } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (payload.purpose !== '2fa-pending' || typeof payload.userId !== 'string') {
      return null;
    }
    return {
      userId: payload.userId,
      rememberMe: payload.rememberMe === true,
    };
  } catch {
    return null;
  }
}

export function createTwoFactorLoginToken(userId: string, rememberMe: boolean): string {
  return jwt.sign(
    { userId, rememberMe, purpose: '2fa-complete' },
    getJwtSecret(),
    { expiresIn: '2m' }
  );
}

export function verifyTwoFactorLoginToken(
  token: string
): { userId: string; rememberMe: boolean } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (payload.purpose !== '2fa-complete' || typeof payload.userId !== 'string') {
      return null;
    }
    return {
      userId: payload.userId,
      rememberMe: payload.rememberMe === true,
    };
  } catch {
    return null;
  }
}
