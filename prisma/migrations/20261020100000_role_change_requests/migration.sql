-- CreateTable
CREATE TABLE `RoleChangeRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fromRole` ENUM('STUDENT', 'MENTOR', 'EMPLOYER', 'COLLEGE_ADMIN', 'PLATFORM_ADMIN') NOT NULL,
    `requestedRole` ENUM('STUDENT', 'MENTOR', 'EMPLOYER', 'COLLEGE_ADMIN', 'PLATFORM_ADMIN') NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `status` VARCHAR(12) NOT NULL DEFAULT 'PENDING',
    `decidedById` VARCHAR(191) NULL,
    `decisionNote` VARCHAR(300) NULL,
    `decidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RoleChangeRequest_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `RoleChangeRequest_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RoleChangeRequest` ADD CONSTRAINT `RoleChangeRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

