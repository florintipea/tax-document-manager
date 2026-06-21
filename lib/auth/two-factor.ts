import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { TOTP, Secret } from 'otpauth';
import { protectSecret, revealSecret } from '@/lib/security/credentials';
import { generateBackupCodes } from '@/lib/security/encryption';
import {
  createPending2FAToken,
  createTwoFactorLoginToken,
  verifyPending2FAToken,
  verifyTwoFactorLoginToken,
} from '@/lib/auth/two-factor-tokens';

const ISSUER = 'TaxDoc';
export const BACKUP_CODE_COUNT = 10;

export function createTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function buildTotp(email: string, secretBase32: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

export function verifyTotpCode(secretBase32: string, email: string, code: string): boolean {
  const totp = buildTotp(email, secretBase32);
  return totp.validate({ token: code.replace(/\s/g, ''), window: 1 }) !== null;
}

export async function generateQrCodeDataUrl(email: string, secretBase32: string): Promise<string> {
  return QRCode.toDataURL(buildTotp(email, secretBase32).toString());
}

export function encryptTotpSecret(secret: string): string {
  return protectSecret(secret);
}

export function decryptTotpSecret(encrypted: string): string {
  return revealSecret(encrypted);
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code.replace(/\s/g, '').toUpperCase(), 12)));
}

export async function verifyBackupCode(
  plainCode: string,
  storedHashes: string[]
): Promise<{ valid: boolean; remainingHashes: string[] }> {
  const normalized = plainCode.replace(/\s/g, '').replace(/-/g, '').toUpperCase();

  for (let i = 0; i < storedHashes.length; i++) {
    if (await bcrypt.compare(normalized, storedHashes[i])) {
      const remainingHashes = storedHashes.filter((_, index) => index !== i);
      return { valid: true, remainingHashes };
    }
  }

  return { valid: false, remainingHashes: storedHashes };
}

export function encryptBackupCodeHashes(hashes: string[]): string {
  return protectSecret(JSON.stringify(hashes));
}

export function decryptBackupCodeHashes(encrypted: string | null | undefined): string[] {
  if (!encrypted) {
    return [];
  }

  try {
    return JSON.parse(revealSecret(encrypted)) as string[];
  } catch {
    try {
      return JSON.parse(encrypted) as string[];
    } catch {
      return [];
    }
  }
}

export function createBackupCodes(): string[] {
  return generateBackupCodes(BACKUP_CODE_COUNT);
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export {
  createPending2FAToken,
  createTwoFactorLoginToken,
  verifyPending2FAToken,
  verifyTwoFactorLoginToken,
};
