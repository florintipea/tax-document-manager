/**
 * Database Seeding Script
 * Creates sample data for development and testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: hashedPassword,
      emailVerified: new Date(),
      country: 'US',
      language: 'en',
      theme: 'system',
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create subscription
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      planId: 'trial',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });

  console.log('✅ Created subscription');

  // Create document categories
  const categories = [
    { name: 'W-2 Forms', icon: '📄', color: '#3B82F6', isDefault: true },
    { name: '1099 Forms', icon: '📋', color: '#10B981', isDefault: true },
    { name: 'Receipts', icon: '🧾', color: '#F59E0B', isDefault: true },
    { name: 'Invoices', icon: '📝', color: '#8B5CF6', isDefault: true },
    { name: 'Bank Statements', icon: '🏦', color: '#EF4444', isDefault: true },
  ];

  for (const category of categories) {
    await prisma.documentCategory.upsert({
      where: { id: category.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: category.name.toLowerCase().replace(/\s+/g, '-'),
        ...category,
      },
    });
  }

  console.log('✅ Created document categories');

  // Create sample documents
  const currentYear = new Date().getFullYear();
  const sampleDocuments = [
    {
      name: 'W-2 Form 2024',
      originalName: 'w2-2024.pdf',
      categoryId: 'w-2-forms',
      fileUrl: '/documents/sample-w2.pdf',
      fileSize: 102400,
      mimeType: 'application/pdf',
      year: currentYear,
      date: new Date(currentYear, 0, 15),
      isTaxRelevant: true,
      taxAmount: 5000.00,
      taxCategory: 'income',
      tags: JSON.stringify(['w2', 'income', '2024']),
      notes: 'Primary employer W-2',
    },
    {
      name: '1099-INT Statement',
      originalName: '1099-int-2024.pdf',
      categoryId: '1099-forms',
      fileUrl: '/documents/sample-1099.pdf',
      fileSize: 51200,
      mimeType: 'application/pdf',
      year: currentYear,
      date: new Date(currentYear, 0, 31),
      isTaxRelevant: true,
      taxAmount: 150.00,
      taxCategory: 'interest',
      tags: JSON.stringify(['1099', 'interest', '2024']),
      notes: 'Bank interest income',
    },
  ];

  for (const doc of sampleDocuments) {
    await prisma.document.create({
      data: {
        ...doc,
        userId: user.id,
      },
    });
  }

  console.log('✅ Created sample documents');

  console.log('🎉 Seeding complete!');
  console.log('\n📝 Test credentials:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


