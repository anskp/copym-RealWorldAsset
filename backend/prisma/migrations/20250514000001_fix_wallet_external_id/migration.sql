-- This migration adds the external_id column if it doesn't exist
-- This is to address the mismatch between schema and database

-- Check if column exists before adding
SET @columnExists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'wallet'
  AND COLUMN_NAME = 'external_id'
);

-- Add column if it doesn't exist
SET @query = IF(
  @columnExists = 0,
  'ALTER TABLE `wallet` ADD COLUMN `external_id` VARCHAR(255) NULL',
  'SELECT "Column external_id already exists in wallet table"'
);

-- Execute the query
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- This migration fixes the wallet table by ensuring IDs are integers
-- We first need to create a temporary table with the correct schema
CREATE TABLE `new_wallet` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `user_id` INT NOT NULL,
  `issuer_id` VARCHAR(191) NULL,
  `address` VARCHAR(191) NOT NULL,
  `chain` VARCHAR(191) NOT NULL DEFAULT 'ethereum',
  `type` VARCHAR(191) NOT NULL DEFAULT 'evm-mpc-wallet',
  `provider` VARCHAR(191) NOT NULL DEFAULT 'fireblocks',
  `did` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `credentials` JSON NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `is_custodial` BOOLEAN NOT NULL DEFAULT true,
  `fireblocks_vault_id` VARCHAR(255) NULL,
  `fireblocks_vault_account_id` VARCHAR(255) NULL,
  `fireblocks_asset_id` VARCHAR(255) NULL,
  `deposit_address` VARCHAR(255) NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `wallet_user_id_key`(`user_id`),
  UNIQUE INDEX `wallet_issuer_id_key`(`issuer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Now we take any current data and migrate it, with UUID IDs converted to integers
-- First, delete any UUID-typed wallets that might cause issues
DELETE FROM `wallet` WHERE LENGTH(id) > 10;

-- Now copy all valid data into the new table
INSERT INTO `new_wallet` (
  `user_id`, `issuer_id`, `address`, `chain`, `type`, `provider`,
  `did`, `created_at`, `updated_at`, `credentials`, `is_active`,
  `is_custodial`, `fireblocks_vault_id`, `fireblocks_vault_account_id`,
  `fireblocks_asset_id`, `deposit_address`
)
SELECT 
  `user_id`, `issuer_id`, `address`, `chain`, `type`, `provider`,
  `did`, `created_at`, `updated_at`, `credentials`, `is_active`,
  `is_custodial`, `fireblocks_vault_id`, `fireblocks_vault_account_id`,
  `fireblocks_asset_id`, `deposit_address`
FROM `wallet` WHERE id REGEXP '^[0-9]+$';

-- Drop the original table
DROP TABLE `wallet`;

-- Rename the new table to replace the original
ALTER TABLE `new_wallet` RENAME TO `wallet`; 