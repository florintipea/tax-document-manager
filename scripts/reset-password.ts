/**
 * Reset a user's password from the command line.
 *
 * Usage:
 *   npm run db:reset-password -- lf.tipea@gmail.com "MyNewPass123"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: npm run db:reset-password -- <email> "<new-password>"');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: { increment: 1 },
    },
  });

  await prisma.session.deleteMany({ where: { userId: user.id } });

  console.log(`✅ Password reset for ${email}`);
  console.log('You can now sign in at http://localhost:3000/auth/login');
}

main()
  .catch((error) => {
    console.error('❌ Password reset failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
