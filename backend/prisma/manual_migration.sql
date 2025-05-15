-- Drop the existing foreign key constraint
ALTER TABLE `kyc_verifications` DROP FOREIGN KEY IF EXISTS `kyc_verifications_user_id_fkey`;

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE `kyc_verifications` ADD CONSTRAINT `kyc_verifications_user_id_fkey` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add setup fields to issuer table
ALTER TABLE `issuer` ADD COLUMN `setup_completed` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `issuer` ADD COLUMN `setup_completed_at` DATETIME NULL;
ALTER TABLE `issuer` ADD COLUMN `selected_asset_type` VARCHAR(255) NULL;
ALTER TABLE `issuer` ADD COLUMN `selected_blockchain` VARCHAR(255) NULL;
ALTER TABLE `issuer` ADD COLUMN `selected_token_standard` VARCHAR(255) NULL; 