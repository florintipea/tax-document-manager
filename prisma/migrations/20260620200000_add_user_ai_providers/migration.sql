-- CreateTable
CREATE TABLE "UserAIProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL DEFAULT 'api_key',
    "apiKey" TEXT,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "model" TEXT,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserAIProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAIProvider_userId_provider_key" ON "UserAIProvider"("userId", "provider");

-- CreateIndex
CREATE INDEX "UserAIProvider_userId_idx" ON "UserAIProvider"("userId");

-- CreateIndex
CREATE INDEX "UserAIProvider_provider_idx" ON "UserAIProvider"("provider");
