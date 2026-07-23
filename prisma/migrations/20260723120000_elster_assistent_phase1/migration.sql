-- CreateTable
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
);

-- CreateTable
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
);

-- CreateTable
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
);

-- CreateTable
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
);

-- CreateIndex
CREATE INDEX "Property_userId_idx" ON "Property"("userId");

-- CreateIndex
CREATE INDEX "NebenkostenAbrechnung_userId_idx" ON "NebenkostenAbrechnung"("userId");

-- CreateIndex
CREATE INDEX "NebenkostenAbrechnung_userId_year_idx" ON "NebenkostenAbrechnung"("userId", "year");

-- CreateIndex
CREATE INDEX "NebenkostenAbrechnung_propertyId_idx" ON "NebenkostenAbrechnung"("propertyId");

-- CreateIndex
CREATE INDEX "RentalYearEntry_userId_idx" ON "RentalYearEntry"("userId");

-- CreateIndex
CREATE INDEX "RentalYearEntry_userId_year_idx" ON "RentalYearEntry"("userId", "year");

-- CreateIndex
CREATE INDEX "RentalYearEntry_propertyId_idx" ON "RentalYearEntry"("propertyId");

-- CreateIndex
CREATE INDEX "TaxLineEntry_userId_idx" ON "TaxLineEntry"("userId");

-- CreateIndex
CREATE INDEX "TaxLineEntry_userId_year_idx" ON "TaxLineEntry"("userId", "year");

-- CreateIndex
CREATE INDEX "TaxLineEntry_category_idx" ON "TaxLineEntry"("category");

-- CreateTable
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
);

-- CreateIndex
CREATE UNIQUE INDEX "GrenzgaengerYearEntry_userId_year_key" ON "GrenzgaengerYearEntry"("userId", "year");

-- CreateIndex
CREATE INDEX "GrenzgaengerYearEntry_userId_idx" ON "GrenzgaengerYearEntry"("userId");

-- CreateIndex
CREATE INDEX "GrenzgaengerYearEntry_userId_year_idx" ON "GrenzgaengerYearEntry"("userId", "year");
