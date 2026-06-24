-- CreateTable
CREATE TABLE "TestReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT,
    "message" TEXT NOT NULL,
    "pageUrl" TEXT,
    "userAgent" TEXT,
    "stackTrace" TEXT,
    "metadata" TEXT,
    "platform" TEXT,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "TestReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TestReport_userId_idx" ON "TestReport"("userId");

-- CreateIndex
CREATE INDEX "TestReport_type_idx" ON "TestReport"("type");

-- CreateIndex
CREATE INDEX "TestReport_status_idx" ON "TestReport"("status");

-- CreateIndex
CREATE INDEX "TestReport_severity_idx" ON "TestReport"("severity");

-- CreateIndex
CREATE INDEX "TestReport_createdAt_idx" ON "TestReport"("createdAt");
