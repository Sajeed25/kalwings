-- CreateTable
CREATE TABLE `UploadChunk` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(40) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `idx` INTEGER NOT NULL,
    `data` LONGBLOB NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UploadChunk_createdAt_idx`(`createdAt`),
    INDEX `UploadChunk_userId_idx`(`userId`),
    UNIQUE INDEX `UploadChunk_token_idx_key`(`token`, `idx`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

