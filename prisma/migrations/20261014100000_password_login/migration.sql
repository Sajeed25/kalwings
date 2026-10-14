-- AlterTable
ALTER TABLE `User` ADD COLUMN `passwordHash` VARCHAR(255) NULL,
    ADD COLUMN `passwordSetAt` DATETIME(3) NULL;
