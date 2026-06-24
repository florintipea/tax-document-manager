-- CreateTable
CREATE TABLE "PricingSurvey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL,
    "willingToPay" REAL,
    "planInterest" TEXT,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PricingSurvey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PricingSurveyInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PricingSurveyInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingSurvey_userId_key" ON "PricingSurvey"("userId");
CREATE INDEX "PricingSurvey_userId_idx" ON "PricingSurvey"("userId");
CREATE INDEX "PricingSurvey_createdAt_idx" ON "PricingSurvey"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PricingSurveyInvite_userId_key" ON "PricingSurveyInvite"("userId");
CREATE INDEX "PricingSurveyInvite_userId_idx" ON "PricingSurveyInvite"("userId");
