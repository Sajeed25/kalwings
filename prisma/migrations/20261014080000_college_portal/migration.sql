-- AlterTable
ALTER TABLE `StudentProfile` ADD COLUMN `departmentId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `collegeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `Department_collegeId_name_key`(`collegeId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Drive` (
    `id` VARCHAR(191) NOT NULL,
    `collegeId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `driveDate` DATETIME(3) NOT NULL,
    `gradYears` JSON NULL,
    `departmentIds` JSON NULL,
    `minCompleteness` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PROPOSED', 'CONFIRMED', 'DECLINED', 'CLOSED') NOT NULL DEFAULT 'PROPOSED',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Drive_collegeId_createdAt_idx`(`collegeId`, `createdAt`),
    INDEX `Drive_companyId_status_idx`(`companyId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriveInvite` (
    `id` VARCHAR(191) NOT NULL,
    `driveId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `status` ENUM('INVITED', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'INVITED',
    `outcome` ENUM('NONE', 'SHORTLISTED', 'OFFERED', 'HIRED', 'NOT_SELECTED') NOT NULL DEFAULT 'NONE',
    `invitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,

    INDEX `DriveInvite_studentId_status_idx`(`studentId`, `status`),
    UNIQUE INDEX `DriveInvite_driveId_studentId_key`(`driveId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StudentProfile` ADD CONSTRAINT `StudentProfile_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_collegeId_fkey` FOREIGN KEY (`collegeId`) REFERENCES `College`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Drive` ADD CONSTRAINT `Drive_collegeId_fkey` FOREIGN KEY (`collegeId`) REFERENCES `College`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Drive` ADD CONSTRAINT `Drive_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveInvite` ADD CONSTRAINT `DriveInvite_driveId_fkey` FOREIGN KEY (`driveId`) REFERENCES `Drive`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveInvite` ADD CONSTRAINT `DriveInvite_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `StudentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
