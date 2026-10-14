-- CreateTable
CREATE TABLE `Assessment` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `kind` ENUM('CODING', 'WRITTEN') NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `instructions` TEXT NOT NULL,
    `languages` JSON NULL,
    `items` JSON NOT NULL,
    `timeLimitMs` INTEGER NOT NULL DEFAULT 2000,
    `memoryMb` INTEGER NOT NULL DEFAULT 128,
    `closesAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssessmentAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `assessmentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `language` VARCHAR(20) NULL,
    `code` TEXT NULL,
    `answers` JSON NULL,
    `status` ENUM('PASSED', 'FAILED', 'ERROR', 'PENDING_REVIEW', 'REVIEWED') NOT NULL,
    `results` JSON NULL,
    `scores` JSON NULL,
    `passed` INTEGER NULL,
    `total` INTEGER NULL,
    `feedback` TEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssessmentAttempt_assessmentId_studentId_createdAt_idx`(`assessmentId`, `studentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Assessment` ADD CONSTRAINT `Assessment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentAttempt` ADD CONSTRAINT `AssessmentAttempt_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `Assessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentAttempt` ADD CONSTRAINT `AssessmentAttempt_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `StudentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
