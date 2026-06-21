/**
 * Ensure the production admin account exists.
 * Creates admin only when missing — never overwrites passwordHash on update.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export function getAdminCredentials(): { email: string; password: string } {
  const email = process.env.ADMIN_EMAIL?.trim();
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

  const existing = await prismaClient.user.findUnique({
    where: { email },
  });

  let admin;

  if (existing) {
    admin = await prismaClient.user.update({
      where: { email },
      data: {
        role: 'admin',
        emailVerified: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        country: existing.country || 'DE',
        language: existing.language || 'de',
      },
    });
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

  return admin;
}

async function main() {
  const admin = await ensureAdmin();
  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error('Admin ensure failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
