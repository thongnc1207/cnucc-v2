/*
  Warnings:

  - You are about to alter the column `image` on the `posts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Json`.

*/
-- AlterTable
ALTER TABLE `posts` MODIFY `image` JSON NULL;
