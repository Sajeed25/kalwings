-- Resume and intro video files (private uploads), per-application attachments, and short share codes for listings.
ALTER TABLE `Upload` MODIFY `mime` VARCHAR(100) NOT NULL, ADD COLUMN `name` VARCHAR(160) NULL;

ALTER TABLE `Opportunity` ADD COLUMN `shortCode` VARCHAR(12) NULL;
UPDATE `Opportunity` SET `shortCode` = LOWER(SUBSTRING(MD5(CONCAT(`id`, 'kw')), 1, 10)) WHERE `shortCode` IS NULL;
CREATE UNIQUE INDEX `Opportunity_shortCode_key` ON `Opportunity`(`shortCode`);

ALTER TABLE `StudentProfile` ADD COLUMN `resumeId` VARCHAR(191) NULL, ADD COLUMN `resumeName` VARCHAR(160) NULL, ADD COLUMN `introVideoId` VARCHAR(191) NULL, ADD COLUMN `introVideoAt` DATETIME(3) NULL;

ALTER TABLE `Application` ADD COLUMN `resumeId` VARCHAR(191) NULL, ADD COLUMN `introVideoId` VARCHAR(191) NULL;
