-- CreateTable
CREATE TABLE "PromoCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "percentOff" REAL,
    "amountOff" REAL,
    "code" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserDiscount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "percentOff" REAL,
    "amountOff" REAL,
    "expiresAt" DATETIME,
    "reason" TEXT,
    "createdByAdminId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserDiscount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCampaign_code_key" ON "PromoCampaign"("code");

-- CreateIndex
CREATE INDEX "PromoCampaign_active_startsAt_endsAt_idx" ON "PromoCampaign"("active", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "PromoCampaign_code_idx" ON "PromoCampaign"("code");

-- CreateIndex
CREATE INDEX "UserDiscount_userId_idx" ON "UserDiscount"("userId");

-- CreateIndex
CREATE INDEX "UserDiscount_active_expiresAt_idx" ON "UserDiscount"("active", "expiresAt");
