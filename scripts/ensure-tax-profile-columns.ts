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
  { name: 'referralCode', ddl: '"referralCode" TEXT' },
  { name: 'referredByCode', ddl: '"referredByCode" TEXT' },
  { name: 'profileRefreshNotice', ddl: '"profileRefreshNotice" TEXT' },
  { name: 'profileRefreshedAt', ddl: '"profileRefreshedAt" DATETIME' },
];

const propertyExtraColumns: Array<{ name: string; ddl: string }> = [
  { name: 'roleHint', ddl: '"roleHint" TEXT' },
  { name: 'monthlyRent', ddl: '"monthlyRent" REAL' },
  { name: 'contractStart', ddl: '"contractStart" TEXT' },
  { name: 'contractEnd', ddl: '"contractEnd" TEXT' },
  { name: 'landlordName', ddl: '"landlordName" TEXT' },
  { name: 'tenantName', ddl: '"tenantName" TEXT' },
  { name: 'needsReview', ddl: '"needsReview" BOOLEAN NOT NULL DEFAULT true' },
  { name: 'sourceHint', ddl: '"sourceHint" TEXT' },
];

const nebenkostenExtraColumns: Array<{ name: string; ddl: string }> = [
  { name: 'umlagefaehigAmount', ddl: '"umlagefaehigAmount" REAL' },
  { name: 'incomeAmount', ddl: '"incomeAmount" REAL' },
  { name: 'sourceKind', ddl: '"sourceKind" TEXT' },
  { name: 'needsReview', ddl: '"needsReview" BOOLEAN NOT NULL DEFAULT true' },
];

const authColumns: Array<{ name: string; ddl: string }> = [
  { name: 'tokenVersion', ddl: '"tokenVersion" INTEGER NOT NULL DEFAULT 0' },
  { name: 'onboardingCompletedAt', ddl: '"onboardingCompletedAt" DATETIME' },
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

/** Create ELSTER assistant tables if migrate deploy skipped them (SQLite drift). */
async function ensureElsterPhase1Tables(db: PrismaClient): Promise<boolean> {
  const required = [
    'Property',
    'NebenkostenAbrechnung',
    'RentalYearEntry',
    'TaxLineEntry',
    'GrenzgaengerYearEntry',
  ];
  const missing: string[] = [];
  for (const name of required) {
    if (!(await tableExists(db, name))) missing.push(name);
  }
  if (missing.length === 0) return true;

  console.log(`Creating missing ELSTER tables: ${missing.join(', ')}`);

  if (!(await tableExists(db, 'Property'))) {
    await db.$executeRawUnsafe(`
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "address" TEXT NOT NULL,
    "purchaseDate" DATETIME,
    "purchasePrice" REAL,
    "purchaseCosts" REAL,
    "buildingValue" REAL,
    "landValue" REAL,
    "notes" TEXT,
    "documentIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`);
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Property_userId_idx" ON "Property"("userId")`
    );
  }

  if (!(await tableExists(db, 'NebenkostenAbrechnung'))) {
    await db.$executeRawUnsafe(`
CREATE TABLE "NebenkostenAbrechnung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "year" INTEGER NOT NULL,
    "settlementAmount" REAL NOT NULL,
    "isNachzahlung" BOOLEAN NOT NULL DEFAULT true,
    "objectLabel" TEXT,
    "notes" TEXT,
    "documentIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NebenkostenAbrechnung_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NebenkostenAbrechnung_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE
)`);
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "NebenkostenAbrechnung_userId_idx" ON "NebenkostenAbrechnung"("userId")`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "NebenkostenAbrechnung_userId_year_idx" ON "NebenkostenAbrechnung"("userId", "year")`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "NebenkostenAbrechnung_propertyId_idx" ON "NebenkostenAbrechnung"("propertyId")`
    );
  }

  if (!(await tableExists(db, 'RentalYearEntry'))) {
    await db.$executeRawUnsafe(`
CREATE TABLE "RentalYearEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "year" INTEGER NOT NULL,
    "objectLabel" TEXT,
    "grossRent" REAL NOT NULL DEFAULT 0,
    "operatingCosts" REAL NOT NULL DEFAULT 0,
    "werbungskosten" REAL NOT NULL DEFAULT 0,
    "afaAmount" REAL,
    "afaRate" REAL,
    "buildingValue" REAL,
    "notes" TEXT,
    "documentIds" TEXT NOT NULL DEFAULT '[]',
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RentalYearEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RentalYearEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE
)`);
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "RentalYearEntry_userId_idx" ON "RentalYearEntry"("userId")`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "RentalYearEntry_userId_year_idx" ON "RentalYearEntry"("userId", "year")`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "RentalYearEntry_propertyId_idx" ON "RentalYearEntry"("propertyId")`
    );
  }

  if (!(await tableExists(db, 'TaxLineEntry'))) {
    await db.$executeRawUnsafe(`
CREATE TABLE "TaxLineEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT,
    "amount" REAL NOT NULL,
    "notes" TEXT,
    "documentIds" TEXT NOT NULL DEFAULT '[]',
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxLineEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`);
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "TaxLineEntry_userId_idx" ON "TaxLineEntry"("userId")`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "TaxLineEntry_userId_year_idx" ON "TaxLineEntry"("userId", "year")`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "TaxLineEntry_category_idx" ON "TaxLineEntry"("category")`
    );
  }

  if (!(await tableExists(db, 'GrenzgaengerYearEntry'))) {
    await db.$executeRawUnsafe(`
CREATE TABLE "GrenzgaengerYearEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "workCountry" TEXT NOT NULL,
    "residenceCountry" TEXT NOT NULL DEFAULT 'DE',
    "foreignEmploymentIncome" REAL NOT NULL DEFAULT 0,
    "foreignWithholdingTax" REAL NOT NULL DEFAULT 0,
    "commutingKmOneWay" REAL,
    "commutingDays" INTEGER,
    "socialInsuranceCountry" TEXT,
    "dbaMethodHint" TEXT,
    "notes" TEXT,
    "documentIds" TEXT NOT NULL DEFAULT '[]',
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GrenzgaengerYearEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`);
    await db.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "GrenzgaengerYearEntry_userId_year_key" ON "GrenzgaengerYearEntry"("userId", "year")`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "GrenzgaengerYearEntry_userId_idx" ON "GrenzgaengerYearEntry"("userId")`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "GrenzgaengerYearEntry_userId_year_idx" ON "GrenzgaengerYearEntry"("userId", "year")`
    );
  }

  for (const name of required) {
    if (!(await tableExists(db, name))) {
      console.warn(`ELSTER table still missing after repair: ${name}`);
      return false;
    }
  }
  return true;
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

    // ELSTER Phase-1 tables — missing tables cause /api/elster/preview 500s
    const elsterTablesOk = await ensureElsterPhase1Tables(db);
    if (elsterTablesOk) {
      console.log('Marking migration as applied: 20260723120000_elster_assistent_phase1');
      resolveMigration('20260723120000_elster_assistent_phase1', true);
    }

    if (await tableExists(db, 'Property')) {
      for (const column of propertyExtraColumns) {
        if (!(await columnExists(db, 'Property', column.name))) {
          await db.$executeRawUnsafe(
            `ALTER TABLE "Property" ADD COLUMN ${column.ddl}`
          );
          console.log(`Added missing Property column: ${column.name}`);
        }
      }
    }

    if (await tableExists(db, 'NebenkostenAbrechnung')) {
      for (const column of nebenkostenExtraColumns) {
        if (!(await columnExists(db, 'NebenkostenAbrechnung', column.name))) {
          await db.$executeRawUnsafe(
            `ALTER TABLE "NebenkostenAbrechnung" ADD COLUMN ${column.ddl}`
          );
          console.log(`Added missing NebenkostenAbrechnung column: ${column.name}`);
        }
      }
    }

    if (
      (await columnExists(db, 'User', 'profileRefreshNotice')) &&
      (await columnExists(db, 'Property', 'monthlyRent')) &&
      (await columnExists(db, 'NebenkostenAbrechnung', 'umlagefaehigAmount'))
    ) {
      console.log('Marking migration as applied: 20260808160000_tax_autofill_extensions');
      resolveMigration('20260808160000_tax_autofill_extensions', true);
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
    '20260723120000_elster_assistent_phase1',
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
