-- AlterTable
ALTER TABLE `Opportunity` ADD COLUMN `closedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `suspendedAt` DATETIME(3) NULL,
    ADD COLUMN `suspendedReason` VARCHAR(300) NULL;
