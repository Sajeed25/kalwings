-- AlterTable
ALTER TABLE `College` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `OfficeHourSlot` ADD COLUMN `sessionId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `StudentProfile` ADD COLUMN `shareWithCollege` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `OfficeHourSlot_sessionId_key` ON `OfficeHourSlot`(`sessionId`);

-- AddForeignKey
ALTER TABLE `OfficeHourSlot` ADD CONSTRAINT `OfficeHourSlot_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `MentorSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

