-- AlterTable
ALTER TABLE `StudentProfile` ADD COLUMN `endorsementsVisibility` ENUM('PUBLIC', 'RECRUITERS', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN `entriesVisibility` ENUM('PUBLIC', 'RECRUITERS', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN `passportVisibility` ENUM('PUBLIC', 'RECRUITERS', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN `projectsVisibility` ENUM('PUBLIC', 'RECRUITERS', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN `username` VARCHAR(30) NULL;

-- CreateTable
CREATE TABLE `PassportEntry` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `kind` ENUM('EXPERIENCE', 'ACHIEVEMENT', 'HACKATHON', 'CERTIFICATE') NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `org` VARCHAR(120) NULL,
    `year` INTEGER NULL,
    `url` VARCHAR(400) NULL,
    `summary` TEXT NULL,
    `verifyRequested` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PassportEntry_studentId_idx`(`studentId`),
    INDEX `PassportEntry_verifyRequested_status_idx`(`verifyRequested`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `StudentProfile_username_key` ON `StudentProfile`(`username`);

-- AddForeignKey
ALTER TABLE `PassportEntry` ADD CONSTRAINT `PassportEntry_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `StudentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
