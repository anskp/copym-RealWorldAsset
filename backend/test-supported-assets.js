/**
 * Test script to get supported assets from Fireblocks
 */
require('dotenv').config();
const fireblocksVaultService = require('./services/fireblocks-vault-service');

// Helper function to log with colors
function log(message, type = 'info') {
  const colors = {
    success: '\x1b[32m',  // green
    error: '\x1b[31m',    // red
    info: '\x1b[36m',     // cyan
    warning: '\x1b[33m',  // yellow
    reset: '\x1b[0m'      // reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function getSupportedAssets() {
  try {
    log('=== GETTING SUPPORTED ASSETS FROM FIREBLOCKS ===', 'info');
    
    // Get all supported assets
    const assets = await fireblocksVaultService.getSupportedAssets();
    
    // Count total assets
    log(`Total assets found: ${assets.length}`, 'success');
    
    // Find testnet assets
    const testnetAssets = assets.filter(asset => 
      asset.id.includes('TEST') || 
      asset.id.includes('GOERLI') || 
      asset.id.includes('SEPOLIA') || 
      asset.id.includes('FUJI') || 
      asset.id.includes('MUMBAI')
    );
    
    // Show all testnet assets
    log('\n=== AVAILABLE TESTNET ASSETS ===', 'info');
    testnetAssets.forEach(asset => {
      log(`ID: ${asset.id} - Name: ${asset.name}`, 'success');
    });
    
    // Find specific blockchain testnet assets
    log('\n=== ETHEREUM TESTNET ASSETS ===', 'info');
    const ethTestAssets = testnetAssets.filter(asset => 
      asset.id.includes('ETH_TEST') || 
      asset.id.includes('GOERLI') || 
      asset.id.includes('SEPOLIA')
    );
    ethTestAssets.forEach(asset => {
      log(`${asset.id} - ${asset.name}`, 'success');
    });
    
    log('\n=== POLYGON TESTNET ASSETS ===', 'info');
    const polygonTestAssets = testnetAssets.filter(asset => 
      asset.id.includes('MATIC') && (asset.id.includes('TEST') || asset.id.includes('MUMBAI'))
    );
    polygonTestAssets.forEach(asset => {
      log(`${asset.id} - ${asset.name}`, 'success');
    });
    
    log('\n=== AVALANCHE TESTNET ASSETS ===', 'info');
    const avalancheTestAssets = testnetAssets.filter(asset => 
      asset.id.includes('AVAX') && (asset.id.includes('TEST') || asset.id.includes('FUJI'))
    );
    avalancheTestAssets.forEach(asset => {
      log(`${asset.id} - ${asset.name}`, 'success');
    });
    
    return testnetAssets;
  } catch (error) {
    log('\n❌ ERROR GETTING SUPPORTED ASSETS', 'error');
    log(`Error: ${error.message || JSON.stringify(error)}`, 'error');
    
    if (error.err) {
      log(`API Error: ${error.err}`, 'error');
    }
  }
}

// Run the test
getSupportedAssets()
  .then(() => log('\nTest completed', 'info'))
  .catch(error => log(`Unhandled error: ${error}`, 'error')); 