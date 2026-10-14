-- AlterTable
ALTER TABLE `Application` ADD COLUMN `referrerId` VARCHAR(191) NULL,
    ADD COLUMN `source` VARCHAR(30) NULL;

-- AlterTable
ALTER TABLE `Company` ADD COLUMN `slug` VARCHAR(40) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Company_slug_key` ON `Company`(`slug`);

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `StudentProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
