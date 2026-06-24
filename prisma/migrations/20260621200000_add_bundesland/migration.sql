-- bundesland was added to schema/API but never migrated on production
ALTER TABLE "User" ADD COLUMN "bundesland" TEXT;
