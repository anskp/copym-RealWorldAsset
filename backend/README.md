# express-back

# Backend Service

## Recent Fixes

### 2025-05-14: Fixed External ID Column Issues

We fixed an issue where the application was failing due to a mismatch between the Prisma schema and the database. 
The schema includes an `external_id` column in the `wallet` table that doesn't exist in the actual database.

**Fix applied:** 
- Modified all Prisma queries that access the wallet table to explicitly specify needed fields rather than returning all fields
- Created a script (`fix-wallet-queries.js`) to automatically apply these fixes across multiple files
- Added error handling to better catch and report any similar issues in the future

**Affected files:**
- services/issuer/fireblocks.service.js
- services/issuer/issuer.service.js
- services/webhooks/webhooks.service.js
- services/wallet/wallet.service.js
- services/crossmint/crossmint-webhooks.service.js
- services/issuer-vc/issuer-vc.service.js
- services/admin/admin.service.js
- utils/crossmintUtils.js
- utils/didUtils.js
- utils/walletMigration.js

**Root cause:** Schema model includes fields that aren't in the database, causing Prisma validation errors.

## Getting Started