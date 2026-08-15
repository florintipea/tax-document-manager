-- AlterTable User: prior-ELSTER profile refresh banner
ALTER TABLE "User" ADD COLUMN "profileRefreshNotice" TEXT;
ALTER TABLE "User" ADD COLUMN "profileRefreshedAt" DATETIME;

-- AlterTable Property: Mietvertrag suggestions
ALTER TABLE "Property" ADD COLUMN "roleHint" TEXT;
ALTER TABLE "Property" ADD COLUMN "monthlyRent" REAL;
ALTER TABLE "Property" ADD COLUMN "contractStart" TEXT;
ALTER TABLE "Property" ADD COLUMN "contractEnd" TEXT;
ALTER TABLE "Property" ADD COLUMN "landlordName" TEXT;
ALTER TABLE "Property" ADD COLUMN "tenantName" TEXT;
ALTER TABLE "Property" ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Property" ADD COLUMN "sourceHint" TEXT;

-- AlterTable NebenkostenAbrechnung: Hausgeld mapping
ALTER TABLE "NebenkostenAbrechnung" ADD COLUMN "umlagefaehigAmount" REAL;
ALTER TABLE "NebenkostenAbrechnung" ADD COLUMN "incomeAmount" REAL;
ALTER TABLE "NebenkostenAbrechnung" ADD COLUMN "sourceKind" TEXT;
ALTER TABLE "NebenkostenAbrechnung" ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT true;
