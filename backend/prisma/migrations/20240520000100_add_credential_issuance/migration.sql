-- CreateTable for tracking credential issuance
CREATE TABLE `credential_issuance` (
  `id` VARCHAR(191) NOT NULL,
  `issuer_credential_id` VARCHAR(191) NOT NULL,
  `recipient_id` INTEGER NOT NULL,
  `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `metadata` JSON NULL,
  
  PRIMARY KEY (`id`),
  INDEX `credential_issuance_issuer_credential_id_idx` (`issuer_credential_id`),
  INDEX `credential_issuance_recipient_id_idx` (`recipient_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `credential_issuance` ADD CONSTRAINT `credential_issuance_issuer_credential_id_fkey` FOREIGN KEY (`issuer_credential_id`) REFERENCES `issuer_credentials`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credential_issuance` ADD CONSTRAINT `credential_issuance_recipient_id_fkey` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
