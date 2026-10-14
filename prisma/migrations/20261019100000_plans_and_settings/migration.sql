-- AlterTable: plans become data, so Company.plan is a key into PlanConfig (existing values STARTER, GROWTH, ENTERPRISE are kept as text)
ALTER TABLE `Company` MODIFY `plan` VARCHAR(40) NOT NULL DEFAULT 'STARTER';

-- CreateTable
CREATE TABLE `PlanConfig` (
    `key` VARCHAR(40) NOT NULL,
    `label` VARCHAR(60) NOT NULL,
    `priceText` VARCHAR(80) NOT NULL,
    `description` VARCHAR(300) NULL,
    `features` JSON NULL,
    `listings` INTEGER NOT NULL,
    `challenges` INTEGER NOT NULL,
    `assessments` INTEGER NOT NULL,
    `team` INTEGER NOT NULL,
    `highlight` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `position` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteSetting` (
    `key` VARCHAR(60) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The three plans that existed before, with the same limits. An admin can now rename, re-price, edit or add plans.
INSERT INTO `PlanConfig` (`key`, `label`, `priceText`, `description`, `listings`, `challenges`, `assessments`, `team`, `highlight`, `position`) VALUES
('STARTER', 'Starter', 'Contact us', 'For teams making their first fresher hires.', 3, 1, 2, 2, false, 1),
('GROWTH', 'Growth', 'Contact us', 'For teams hiring through the year.', 20, 5, 10, 10, true, 2),
('ENTERPRISE', 'Enterprise', 'Talk to us', 'For campus-scale and multi-city hiring.', 100, 25, 50, 25, false, 3);
