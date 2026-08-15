-- AlterTable
ALTER TABLE "Document" ADD COLUMN "fileHash" TEXT;
ALTER TABLE "Document" ADD COLUMN "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "Document_userId_fileHash_idx" ON "Document"("userId", "fileHash");
