/**
 * Create Admin User Script
 * Creates an admin user with full permissions
 */

import { PrismaClient } from '@prisma/client';
import { getAdminCredentials, ensureAdmin } from './ensure-admin';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating admin user...');

  const { email } = getAdminCredentials();
  const admin = await ensureAdmin(prisma);

  console.log('✅ Admin user created/updated:', admin.email);
  console.log('✅ Role:', admin.role);
  console.log('✅ Admin subscription created');

  console.log('\n🎉 Admin account ready!');
  console.log('\n📝 Admin email:', email);
  console.log('\n⚠️  Use ADMIN_PASSWORD from environment to sign in.');
}

main()
  .catch((e) => {
    console.error('❌ Failed to create admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
