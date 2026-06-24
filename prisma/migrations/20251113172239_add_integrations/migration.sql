-- CreateTable
CREATE TABLE "WISOConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "lastSync" DATETIME,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "credentials" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WISOConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookLMConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "lastSync" DATETIME,
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotebookLMConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecurityThreat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT true,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "SecurityThreat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WISOConnection_userId_key" ON "WISOConnection"("userId");

-- CreateIndex
CREATE INDEX "WISOConnection_userId_idx" ON "WISOConnection"("userId");

-- CreateIndex
CREATE INDEX "NotebookLMConnection_userId_idx" ON "NotebookLMConnection"("userId");

-- CreateIndex
CREATE INDEX "NotebookLMConnection_notebookId_idx" ON "NotebookLMConnection"("notebookId");

-- CreateIndex
CREATE INDEX "SecurityThreat_userId_idx" ON "SecurityThreat"("userId");

-- CreateIndex
CREATE INDEX "SecurityThreat_type_idx" ON "SecurityThreat"("type");

-- CreateIndex
CREATE INDEX "SecurityThreat_severity_idx" ON "SecurityThreat"("severity");

-- CreateIndex
CREATE INDEX "SecurityThreat_createdAt_idx" ON "SecurityThreat"("createdAt");
