-- CreateTable
CREATE TABLE "DailyAdClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateKey" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyAdClick_dateKey_key" ON "DailyAdClick"("dateKey");

-- CreateIndex
CREATE INDEX "DailyAdClick_dateKey_idx" ON "DailyAdClick"("dateKey");
