-- CreateTable
CREATE TABLE `ATIS` (
    `atisId` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `airport` VARCHAR(191) NOT NULL,
    `information` VARCHAR(191) NULL,
    `metar` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `facility` VARCHAR(191) NOT NULL,
    `activeApproaches` VARCHAR(191) NOT NULL,
    `activeDepartures` VARCHAR(191) NOT NULL,
    `lastUpdated` DATETIME(3) NOT NULL,

    PRIMARY KEY (`atisId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
