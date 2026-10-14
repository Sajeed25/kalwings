-- CreateTable
CREATE TABLE `Challenge` (
    `id` VARCHAR(191) NOT NULL,
    `opportunityId` VARCHAR(191) NOT NULL,
    `kind` ENUM('CODING', 'SOFTWARE', 'DATA_SQL', 'DESIGN', 'BUSINESS_CASE', 'MARKETING', 'HARDWARE_IOT', 'RESEARCH', 'OTHER') NOT NULL,
    `style` ENUM('COMPETITIVE', 'COLLABORATIVE', 'PORTFOLIO') NOT NULL DEFAULT 'PORTFOLIO',
    `allowTeams` BOOLEAN NOT NULL DEFAULT false,
    `brief` TEXT NOT NULL,
    `rubric` JSON NOT NULL,
    `skillTag` VARCHAR(60) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Challenge_opportunityId_key`(`opportunityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `challengeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `summary` TEXT NOT NULL,
    `workUrl` VARCHAR(400) NOT NULL,
    `teamNote` VARCHAR(300) NULL,
    `status` ENUM('SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'NOT_SELECTED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    `scores` JSON NULL,
    `totalScore` INTEGER NULL,
    `maxScore` INTEGER NULL,
    `feedback` TEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Submission_challengeId_status_idx`(`challengeId`, `status`),
    UNIQUE INDEX `Submission_challengeId_studentId_key`(`challengeId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Challenge` ADD CONSTRAINT `Challenge_opportunityId_fkey` FOREIGN KEY (`opportunityId`) REFERENCES `Opportunity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_challengeId_fkey` FOREIGN KEY (`challengeId`) REFERENCES `Challenge`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `StudentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
