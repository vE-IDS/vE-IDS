/*
  Warnings:

  - You are about to drop the column `scope` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "scope",
ADD COLUMN     "scopes" TEXT;
