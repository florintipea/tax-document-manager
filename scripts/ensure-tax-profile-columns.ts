#!/usr/bin/env npx tsx
/**
 * Ensures tax-profile User columns exist before prisma migrate deploy.
 * Handles SQLite drift when columns were added via db push but migrations failed.
 */
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const taxProfileColumns: Array<{ name: string; ddl: string }> = [
  { name: 'numberOfChildren', ddl: '"numberOfChildren" INTEGER NOT NULL DEFAULT 0' },
  { name: 'steuerklasse', ddl: '"steuerklasse" TEXT NOT NULL DEFAULT \'I\'' },
  { name: 'isCrossBorder', ddl: '"isCrossBorder" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'hasRentalIncome', ddl: '"hasRentalIncome" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'bundesland', ddl: '"bundesland" TEXT' },
  { name: 'deFilingMode', ddl: '"deFilingMode" TEXT NOT NULL DEFAULT \'einzel\'' },
  { name: 'spouseIncome', ddl: '"spouseIncome" REAL NOT NULL DEFAULT 0' },
  { name: 'calculatorDraft', ddl: '"calculatorDraft" TEXT' },
  { name: 'anrede', ddl: '"anrede" TEXT' },
  { name: 'vorname', ddl: '"vorname" TEXT' },
  { name: 'nachname', ddl: '"nachname" TEXT' },
  { name: 'geburtsdatum', ddl: '"geburtsdatum" TEXT' },
  { name: 'steuernummer', ddl: '"steuernummer" TEXT' },
  { name: 'idNr', ddl: '"idNr" TEXT' },
  { name: 'religion', ddl: '"religion" TEXT' },
  { name: 'street', ddl: '"street" TEXT' },
  { name: 'zip', ddl: '"zip" TEXT' },
  { name: 'city', ddl: '"city" TEXT' },
  { name: 'hasEmploymentIncome', ddl: '"hasEmploymentIncome" BOOLEAN NOT NULL DEFAULT true' },
  { name: 'hasSelfEmployment', ddl: '"hasSelfEmployment" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'hasCapitalIncome', ddl: '"hasCapitalIncome" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'partnerAnrede', ddl: '"partnerAnrede" TEXT' },
  { name: 'partnerVorname', ddl: '"partnerVorname" TEXT' },
  { name: 'partnerNachname', ddl: '"partnerNachname" TEXT' },
  { name: 'partnerGeburtsdatum', ddl: '"partnerGeburtsdatum" TEXT' },
  { name: 'partnerSteuernummer', ddl: '"partnerSteuernummer" TEXT' },
  { name: 'partnerIdNr', ddl: '"partnerIdNr" TEXT' },
  { name: 'partnerDifferentAddress', ddl: '"partnerDifferentAddress" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'partnerStreet', ddl: '"partnerStreet" TEXT' },
  { name: 'partnerZip', ddl: '"partnerZip" TEXT' },
  { name: 'partnerCity', ddl: '"partnerCity" TEXT' },
  { name: 'partnerReligion', ddl: '"partnerReligion" TEXT' },
  { name: 'partnerSteuerklasse', ddl: '"partnerSteuerklasse" TEXT' },
  { name: 'partnerHasEmployment', ddl: '"partnerHasEmployment" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'partnerHasSelfEmployment', ddl: '"partnerHasSelfEmployment" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'partnerHasCapitalIncome', ddl: '"partnerHasCapitalIncome" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'partnerHasRentalIncome', ddl: '"partnerHasRentalIncome" BOOLEAN NOT NULL DEFAULT false' },
  { name: 'partnerIsCrossBorder', ddl: '"partnerIsCrossBorder" BOOLEAN NOT NULL DEFAULT false' },
];

const authColumns: Array<{ name: string; ddl: string }> = [
  { name: 'tokenVersion', ddl: '"tokenVersion" INTEGER NOT NULL DEFAULT 0' },
];

const subscriptionColumns: Array<{ name: string; ddl: string }> = [
  { name: 'billingInterval', ddl: '"billingInterval" TEXT' },
  { name: 'steuerjahr', ddl: '"steuerjahr" INTEGER' },
];

async function userTableExists(db: PrismaClient): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<Array<{ name: string }>>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
  );
  return rows.length > 0;
}

async function columnExists(
  db: PrismaClient,
  table: string,
  column: string
): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("${table}")`
  );
  return rows.some((row) => row.name === column);
}

async function tableExists(db: PrismaClient, table: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<Array<{ name: string }>>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
  );
  return rows.length > 0;
}

function resolveMigration(name: string, applied: boolean) {
  const flag = applied ? '--applied' : '--rolled-back';
  try {
    execSync(`npx prisma migrate resolve ${flag} ${name}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const output = [
      error instanceof Error && 'stdout' in error
        ? String((error as { stdout?: string }).stdout ?? '')
        : '',
      error instanceof Error && 'stderr' in error
        ? String((error as { stderr?: string }).stderr ?? '')
        : '',
    ].join('\n');
    if (!/P3008|already recorded/i.test(output)) {
      console.warn(`Could not resolve migration ${name}:`, output.trim());
    }
  }
}

async function main() {
  const db = new PrismaClient();

  try {
    if (!(await userTableExists(db))) {
      console.log(
        'User table not found yet — skipping tax-profile column repair (run migrations first).'
      );
      return;
    }

    for (const column of taxProfileColumns) {
      if (!(await columnExists(db, 'User', column.name))) {
        await db.$executeRawUnsafe(
          `ALTER TABLE "User" ADD COLUMN ${column.ddl}`
        );
        console.log(`Added missing User column: ${column.name}`);
      }
    }

    for (const column of authColumns) {
      if (!(await columnExists(db, 'User', column.name))) {
        await db.$executeRawUnsafe(
          `ALTER TABLE "User" ADD COLUMN ${column.ddl}`
        );
        console.log(`Added missing User column: ${column.name}`);
      }
    }

    const hasBackupCodes = await columnExists(db, 'User', 'backupCodes');
    const hasTwoFactorBackupCodes = await columnExists(
      db,
      'User',
      'twoFactorBackupCodes'
    );
    if (hasBackupCodes && !hasTwoFactorBackupCodes) {
      await db.$executeRawUnsafe(
        'ALTER TABLE "User" RENAME COLUMN "backupCodes" TO "twoFactorBackupCodes"'
      );
      console.log('Renamed User.backupCodes → twoFactorBackupCodes');
    } else if (!hasTwoFactorBackupCodes) {
      await db.$executeRawUnsafe(
        `ALTER TABLE "User" ADD COLUMN "twoFactorBackupCodes" TEXT NOT NULL DEFAULT '[]'`
      );
      console.log('Added missing User column: twoFactorBackupCodes');
    }

    if (await tableExists(db, 'Subscription')) {
      for (const column of subscriptionColumns) {
        if (!(await columnExists(db, 'Subscription', column.name))) {
          await db.$executeRawUnsafe(
            `ALTER TABLE "Subscription" ADD COLUMN ${column.ddl}`
          );
          console.log(`Added missing Subscription column: ${column.name}`);
        }
      }
    }

    const migrationColumns: Array<{ name: string; columns: string[]; table?: string }> = [
      {
        name: '20260620180000_add_number_of_children',
        columns: ['numberOfChildren'],
      },
      {
        name: '20260620210000_add_tax_profile_fields',
        columns: ['steuerklasse', 'isCrossBorder', 'hasRentalIncome'],
      },
      {
        name: '20260620190000_add_de_joint_filing',
        columns: ['deFilingMode', 'spouseIncome'],
      },
      {
        name: '20260621200000_add_bundesland',
        columns: ['bundesland'],
      },
      {
        name: '20260723140000_add_calculator_draft',
        columns: ['calculatorDraft'],
      },
      {
        name: '20260723150000_steuerprofil_partner_fields',
        columns: [
          'steuernummer',
          'idNr',
          'partnerVorname',
          'partnerIdNr',
          'hasEmploymentIncome',
          'partnerIsCrossBorder',
        ],
      },
      {
        name: '20260621120000_steuerjahr_billing',
        table: 'Subscription',
        columns: ['billingInterval', 'steuerjahr'],
      },
      {
        name: '20260621180000_pricing_survey_license_model',
        table: 'PricingSurvey',
        columns: ['id'],
      },
      {
        name: '20260621210000_two_factor_backup_codes',
        columns: ['twoFactorBackupCodes'],
      },
      {
        name: '20260621220000_add_token_version',
        columns: ['tokenVersion'],
      },
    ];

    for (const migration of migrationColumns) {
      const table = migration.table ?? 'User';
      const ready = await Promise.all(
        migration.columns.map((column) => columnExists(db, table, column))
      );
      if (ready.every(Boolean)) {
        console.log(`Marking migration as applied: ${migration.name}`);
        resolveMigration(migration.name, true);
      }
    }
  } finally {
    await db.$disconnect();
  }

  for (const migration of [
    '20260620180000_add_number_of_children',
    '20260620210000_add_tax_profile_fields',
    '20260620190000_add_de_joint_filing',
    '20260621200000_add_bundesland',
    '20260723140000_add_calculator_draft',
    '20260723150000_steuerprofil_partner_fields',
    '20260621120000_steuerjahr_billing',
    '20260621180000_pricing_survey_license_model',
    '20260621210000_two_factor_backup_codes',
    '20260621220000_add_token_version',
  ]) {
    try {
      const status = execSync('npx prisma migrate status', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (status.includes(migration) && /failed/i.test(status)) {
        console.log(`Resolving failed migration as applied: ${migration}`);
        resolveMigration(migration, true);
      }
    } catch (error) {
      const output = [
        error instanceof Error && 'stdout' in error
          ? String((error as { stdout?: string }).stdout ?? '')
          : '',
        error instanceof Error && 'stderr' in error
          ? String((error as { stderr?: string }).stderr ?? '')
          : '',
      ].join('\n');
      if (output.includes(migration) && /failed/i.test(output)) {
        console.log(`Resolving failed migration as applied: ${migration}`);
        resolveMigration(migration, true);
      }
    }
  }
}

main().catch((error) => {
  console.warn('Tax-profile column repair skipped:', error);
});
