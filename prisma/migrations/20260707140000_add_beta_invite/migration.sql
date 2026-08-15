-- CreateTable
CREATE TABLE "BetaInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testerEmail" TEXT NOT NULL,
    "assignedToEmail" TEXT NOT NULL,
    "assignedToName" TEXT,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedIp" TEXT,
    CONSTRAINT "BetaInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaInvite_userId_key" ON "BetaInvite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BetaInvite_testerEmail_key" ON "BetaInvite"("testerEmail");

-- CreateIndex
CREATE INDEX "BetaInvite_assignedToEmail_idx" ON "BetaInvite"("assignedToEmail");

-- CreateIndex
CREATE INDEX "BetaInvite_assignedAt_idx" ON "BetaInvite"("assignedAt");
