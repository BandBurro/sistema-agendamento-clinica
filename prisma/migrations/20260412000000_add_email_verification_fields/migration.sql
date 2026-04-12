-- AlterTable: add email verification fields missing from initial migration
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "verifyToken" TEXT;
ALTER TABLE "User" ADD COLUMN "verifyTokenExp" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_verifyToken_key" ON "User"("verifyToken");
