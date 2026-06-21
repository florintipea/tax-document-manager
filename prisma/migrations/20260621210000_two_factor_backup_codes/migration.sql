-- Rename backupCodes to twoFactorBackupCodes for clearer 2FA semantics
ALTER TABLE "User" RENAME COLUMN "backupCodes" TO "twoFactorBackupCodes";
