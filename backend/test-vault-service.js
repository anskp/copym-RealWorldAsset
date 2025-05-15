/**
 * Test script for our working Fireblocks vault service
 * This uses the combined JWT Bearer + X-API-Key approach that we confirmed works
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

// Test all vault operations
async function testVaultOperations() {
  log('=== TESTING FIREBLOCKS VAULT SERVICE ===', 'info');
  log('Using the Combined JWT Bearer + X-API-Key authentication method', 'info');
  
  try {
    // Step 1: Create a vault
    log('\nSTEP 1: Creating a vault...', 'info');
    const vaultData = {
      name: `Test Vault ${Date.now()}`,
      hiddenOnUI: false,
      customerRefId: `test-${Date.now()}`,
      autoFuel: false
    };
    
    const vault = await fireblocksVaultService.createVault(vaultData);
    log('✅ Vault created successfully:', 'success');
    log(`Vault ID: ${vault.id}`, 'success');
    log(`Vault Name: ${vault.name}`, 'success');
    
    // Save vault ID for subsequent operations
    const vaultId = vault.id;
    
    // Step 2: Get the vault
    log('\nSTEP 2: Retrieving the vault...', 'info');
    const retrievedVault = await fireblocksVaultService.getVault(vaultId);
    log('✅ Vault retrieved successfully:', 'success');
    log(`Vault ID: ${retrievedVault.id}`, 'success');
    log(`Vault Name: ${retrievedVault.name}`, 'success');
    
    // Step 3: Rename the vault
    log('\nSTEP 3: Renaming the vault...', 'info');
    const newName = `Renamed Vault ${Date.now()}`;
    const renamedVault = await fireblocksVaultService.renameVault(vaultId, newName);
    log('✅ Vault renamed successfully:', 'success');
    log(`New Vault Name: ${renamedVault.name}`, 'success');
    
    // Step 4: Add and activate BTC wallet
    log('\nSTEP 4: Adding BTC wallet to vault...', 'info');
    const assetId = 'BTC_TEST';
    try {
      const walletResult = await fireblocksVaultService.createWallet(vaultId, assetId);
      log('✅ Wallet created successfully:', 'success');
      log(`Wallet: ${JSON.stringify(walletResult)}`, 'success');
      
      // Step 5: Activate the wallet
      log('\nSTEP 5: Activating the wallet...', 'info');
      const activationResult = await fireblocksVaultService.activateWallet(vaultId, assetId);
      log('✅ Wallet activated successfully:', 'success');
      log(`Activation: ${JSON.stringify(activationResult)}`, 'success');
      
      // Step 6: Get wallet balance
      log('\nSTEP 6: Getting wallet balance...', 'info');
      const balance = await fireblocksVaultService.getWalletBalance(vaultId, assetId);
      log('✅ Balance retrieved successfully:', 'success');
      log(`Balance: ${JSON.stringify(balance)}`, 'success');
      
      // Step 7: Refresh wallet balance
      log('\nSTEP 7: Refreshing wallet balance...', 'info');
      const refreshedBalance = await fireblocksVaultService.refreshWalletBalance(vaultId, assetId);
      log('✅ Balance refreshed successfully:', 'success');
      log(`Refreshed Balance: ${JSON.stringify(refreshedBalance)}`, 'success');
    } catch (walletError) {
      log(`❌ Wallet operations failed: ${walletError.message}`, 'error');
      log('This may be expected if your API key does not have wallet permissions', 'warning');
    }
    
    // List all vaults for verification (using paginated endpoint)
    log('\nSTEP 8: Listing all vaults (paginated)...', 'info');
    const vaultsList = await fireblocksVaultService.listVaults(10, 0);
    log('✅ Vaults listed successfully:', 'success');
    
    // The pagination response format is different than expected
    // Handle both possible formats
    if (vaultsList.paging) {
      log(`Pagination: Page ${vaultsList.paging.current} of ${vaultsList.paging.total}`, 'success');
    } else {
      log(`Pagination: Page 0 of ${Math.ceil(vaultsList.accounts.length / 10)}`, 'success');
    }
    
    log(`Found ${vaultsList.accounts ? vaultsList.accounts.length : 0} vaults`, 'success');
    
    // Success summary
    log('\n=== TEST SUMMARY ===', 'info');
    log('✅ Vault creation: SUCCESS', 'success');
    log('✅ Vault retrieval: SUCCESS', 'success');
    log('✅ Vault renaming: SUCCESS', 'success');
    log('✅ Vault listing (paginated): SUCCESS', 'success');
    log(`New vault ID created: ${vaultId}`, 'success');
    
  } catch (error) {
    log('\n❌ TEST FAILED', 'error');
    log(`Error: ${error.message}`, 'error');
    
    if (error.response?.data) {
      log(`API Error: ${JSON.stringify(error.response.data)}`, 'error');
    }
  }
}

// Test createIssuerVault functionality
async function testCreateIssuerVault() {
  log('\n=== TESTING ISSUER VAULT CREATION ===', 'info');
  
  try {
    // Test data for issuer vault creation
    const issuerData = {
      issuerId: 'test-issuer-' + Date.now(),
      companyName: 'Test Company',
      assetType: 'EQUITY',
      blockchain: 'ethereum',
      tokenStandard: 'ERC-20'
    };
    
    log('Creating vault with the following options:', 'info');
    log(`Company: ${issuerData.companyName}`, 'info');
    log(`Asset Type: ${issuerData.assetType}`, 'info');
    log(`Blockchain: ${issuerData.blockchain}`, 'info');
    log(`Token Standard: ${issuerData.tokenStandard}`, 'info');
    
    // Create the vault
    const result = await fireblocksVaultService.createIssuerVault(issuerData);
    
    // Check the result
    log('\n✅ Issuer vault created successfully:', 'success');
    log(`Vault ID: ${result.vault.id}`, 'success');
    log(`Vault Name: ${result.vault.name}`, 'success');
    log(`Asset ID: ${result.wallet.assetId}`, 'success');
    log(`Blockchain: ${result.wallet.blockchain}`, 'success');
    log(`Token Standard: ${result.wallet.tokenStandard}`, 'success');
    
    return result;
  } catch (error) {
    log('\n❌ ISSUER VAULT CREATION FAILED', 'error');
    log(`Error: ${error.message}`, 'error');
    
    if (error.response?.data) {
      log(`API Error: ${JSON.stringify(error.response.data)}`, 'error');
    }
  }
}

// Choose which test to run
const testType = process.argv[2]; // Get argument from command line

if (testType === 'issuer') {
  // Run the issuer vault test only
  testCreateIssuerVault()
    .then(() => log('\nIssuer vault test completed', 'info'))
    .catch(error => log(`Unhandled error: ${error}`, 'error'));
} else {
  // Run the standard vault operations test
  testVaultOperations()
    .then(() => log('\nTest completed', 'info'))
    .catch(error => log(`Unhandled error: ${error}`, 'error'));
} 