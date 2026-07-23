import crypto from 'crypto';
import { encrypt, decrypt } from '@/lib/security/encryption';

const FALLBACK_PREFIX = 'enc:';

function getFallbackKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET is required to store integration credentials');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/** Try both ENCRYPTION_KEY and NEXTAUTH_SECRET so key rotation / order changes do not brick saved API keys. */
function getFallbackKeyCandidates(): Buffer[] {
  const secrets = [process.env.ENCRYPTION_KEY, process.env.NEXTAUTH_SECRET].filter(
    (s): s is string => Boolean(s && s.length > 0)
  );
  const unique = [...new Set(secrets)];
  if (unique.length === 0) {
    throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET is required to store integration credentials');
  }
  return unique.map((secret) => crypto.createHash('sha256').update(secret).digest());
}

function encryptWithKey(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${FALLBACK_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decryptWithKey(payload: string, key: Buffer): string {
  const normalized = payload.startsWith(FALLBACK_PREFIX)
    ? payload.slice(FALLBACK_PREFIX.length)
    : payload;
  const parts = normalized.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted credential format');
  }

  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function protectSecret(value: string): string {
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32) {
    return encrypt(value);
  }
  return encryptWithKey(value, getFallbackKey());
}

export function revealSecret(value: string): string {
  if (value.startsWith(FALLBACK_PREFIX)) {
    const candidates = getFallbackKeyCandidates();
    let lastError: unknown;
    for (const key of candidates) {
      try {
        return decryptWithKey(value, key);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to decrypt credential');
  }
  return decrypt(value);
}
