-- Add missing fields to wallet table
ALTER TABLE `wallet` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `wallet` ADD COLUMN `is_custodial` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `wallet` ADD COLUMN `fireblocks_vault_id` VARCHAR(255) NULL;
ALTER TABLE `wallet` ADD COLUMN `fireblocks_vault_account_id` VARCHAR(255) NULL;
ALTER TABLE `wallet` ADD COLUMN `fireblocks_asset_id` VARCHAR(255) NULL;
ALTER TABLE `wallet` ADD COLUMN `deposit_address` VARCHAR(255) NULL; 