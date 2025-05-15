-- Drop the @map attribute from external_id in the schema
-- And add the column directly to the database

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