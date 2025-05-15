const fs = require('fs');
const path = require('path');

// Files with queries that need fixing
const filesToFix = [
  'services/webhooks/webhooks.service.js',
  'services/wallet/wallet.service.js',
  'services/issuer/fireblocks.service.js',
  'services/crossmint/crossmint-webhooks.service.js',
  'services/issuer-vc/issuer-vc.service.js',
  'services/admin/admin.service.js',
  'utils/crossmintUtils.js',
  'utils/didUtils.js',
  'utils/walletMigration.js'
];

// Regular expressions to match different patterns of wallet queries
const patterns = [
  {
    // Simple findFirst without select
    regex: /prisma\.wallet\.findFirst\(\s*{\s*where:/g,
    replacement: `prisma.wallet.findFirst({\n    select: {\n      id: true,\n      address: true,\n      type: true,\n      chain: true,\n      is_active: true,\n      is_custodial: true,\n      user_id: true,\n      issuer_id: true,\n      created_at: true,\n      updated_at: true,\n      fireblocks_vault_id: true,\n      fireblocks_vault_account_id: true,\n      fireblocks_asset_id: true,\n      deposit_address: true\n    },\n    where:`
  },
  {
    // Include in other queries
    regex: /wallet:\s*true/g,
    replacement: `wallet: { 
      select: {
        id: true,
        address: true,
        type: true,
        chain: true,
        is_active: true,
        is_custodial: true,
        user_id: true,
        issuer_id: true,
        created_at: true,
        updated_at: true,
        fireblocks_vault_id: true,
        fireblocks_vault_account_id: true,
        fireblocks_asset_id: true,
        deposit_address: true
      }
    }`
  }
];

// Process each file
filesToFix.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    // Skip if file doesn't exist
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      return;
    }
    
    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    
    // Apply each pattern replacement
    patterns.forEach(({ regex, replacement }) => {
      content = content.replace(regex, replacement);
    });
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log(`Updated: ${filePath}`);
    } else {
      console.log(`No changes needed for: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Done fixing wallet queries!'); 