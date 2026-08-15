/**
 * Ensure the production admin account exists.
 * Creates admin with ADMIN_PASSWORD when missing.
 * On every startup: clears admin lockout and syncs passwordHash from ADMIN_PASSWORD
 * when the env value does not match the stored hash (beta — env is the source of truth).
 * ADMIN_FORCE_RESET=true still forces an immediate reset.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { clearRateLimitsByPrefix, RateLimitPresets } from '../lib/security/rate-limit';

const prisma = new PrismaClient();

export function normalizeAdminEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function shouldForceAdminReset(): boolean {
  return process.env.ADMIN_FORCE_RESET === 'true';
}

export function getAdminCredentials(): { email: string; password: string } {
  const email = normalizeAdminEmail(process.env.ADMIN_EMAIL?.trim() ?? '');
  const password = process.env.ADMIN_PASSWORD;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !password) {
    throw new Error('ADMIN_PASSWORD must be set in production');
  }
  if (isProduction && !email) {
    throw new Error('ADMIN_EMAIL must be set in production');
  }
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }

  return { email, password };
}

export async function ensureAdmin(prismaClient: PrismaClient = prisma) {
  const { email, password } = getAdminCredentials();
  const forceReset = shouldForceAdminReset();

  const existing = await prismaClient.user.findUnique({
    where: { email },
  });

  let admin;

  if (existing) {
    const hadLockout =
      existing.failedLoginAttempts > 0 ||
      (existing.lockedUntil !== null && existing.lockedUntil > new Date());

    const updateData: {
      role: 'admin';
      emailVerified: Date;
      failedLoginAttempts: number;
      lockedUntil: null;
      country: string;
      language: string;
      passwordHash?: string;
      tokenVersion?: { increment: number };
    } = {
      role: 'admin',
      emailVerified: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      country: existing.country || 'DE',
      language: existing.language || 'de',
    };

    const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
    const needsPasswordSync = forceReset || !passwordMatches;

    if (needsPasswordSync) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
      updateData.tokenVersion = { increment: 1 };
      if (forceReset) {
        console.warn(
          'ADMIN_FORCE_RESET=true: admin password reset. Remove this env var after login works.'
        );
      } else {
        console.log(`Admin password synced from ADMIN_PASSWORD for ${email}.`);
      }
    }

    admin = await prismaClient.user.update({
      where: { email },
      data: updateData,
    });

    if (hadLockout) {
      console.log(`Admin lockout cleared for ${email}.`);
    }
  } else {
    const adminHash = await bcrypt.hash(password, 12);
    admin = await prismaClient.user.create({
      data: {
        email,
        name: 'Admin',
        passwordHash: adminHash,
        role: 'admin',
        emailVerified: new Date(),
        country: 'DE',
        language: 'de',
      },
    });
  }

  await prismaClient.subscription.upsert({
    where: { userId: admin.id },
    update: {
      planId: 'admin',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    create: {
      userId: admin.id,
      planId: 'admin',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const clearedRateLimits = await clearRateLimitsByPrefix(
    RateLimitPresets.login.keyPrefix
  ).catch((error) => {
    console.warn('Could not clear login rate limits on startup:', error);
    return 0;
  });
  if (clearedRateLimits > 0) {
    console.log(`Cleared ${clearedRateLimits} login rate-limit entries on startup.`);
  }

  return admin;
}

async function main() {
  const admin = await ensureAdmin();
  const resetNote = shouldForceAdminReset() ? ' (password reset applied)' : '';
  console.log(`Admin ready: ${admin.email}${resetNote}`);
}

main()
  .catch((error) => {
    console.error('Admin ensure failed (non-fatal):', error);
    process.exit(0);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
