/**
 * Fireblocks Vault Creation Test
 * 
 * This test file demonstrates creating a vault for an issuer using the Fireblocks API.
 * It supports both real API calls and mock mode for development purposes.
 */

// Import required dependencies
const { FireblocksSDK } = require('fireblocks-sdk');
const { prisma } = require('../config/prisma');
const { createIssuerVaultAccount, addAssetToVault, createToken } = require('../utils/fireblocksUtils');
require('dotenv').config();

// Set environment variables for testing
const USE_MOCK = process.env.USE_MOCK_FIREBLOCKS === 'true';
const FIREBLOCKS_API_KEY = process.env.FIREBLOCKS_API_KEY;
const FIREBLOCKS_API_SECRET_PATH = process.env.FIREBLOCKS_API_SECRET_PATH;
const BASE_URL = process.env.FIREBLOCKS_BASE_URL || 'https://sandbox-api.fireblocks.io';

/**
 * Create a vault directly using the Fireblocks SDK
 * This demonstrates the direct SDK usage approach
 */
async function createVaultWithSDK() {
  try {
    console.log('----- TEST: Creating Vault with Direct SDK -----');
    console.log('Using mock mode:', USE_MOCK ? 'Yes' : 'No');
    
    // Initialize SDK if not in mock mode
    if (!USE_MOCK && FIREBLOCKS_API_KEY && FIREBLOCKS_API_SECRET_PATH) {
      const fs = require('fs');
      console.log(`Loading API secret from: ${FIREBLOCKS_API_SECRET_PATH}`);
      
      if (!fs.existsSync(FIREBLOCKS_API_SECRET_PATH)) {
        throw new Error(`Secret key file not found at path: ${FIREBLOCKS_API_SECRET_PATH}`);
      }
      
      const privateKey = fs.readFileSync(FIREBLOCKS_API_SECRET_PATH, 'utf8');
      const fireblocks = new FireblocksSDK(privateKey, FIREBLOCKS_API_KEY, BASE_URL);
      
      // Create a test vault account
      console.log('Creating vault account...');
      const response = await fireblocks.vaults.createVaultAccount({
        createVaultAccountRequest: {
          name: `Test Vault ${new Date().toISOString()}`,
          autoFuel: false,
          hiddenOnUI: false,
          customerRefId: `test-${Date.now()}`
        }
      });
      
      console.log('Vault created successfully:');
      console.log('Vault ID:', response.data.id);
      console.log('Vault Name:', response.data.name);
      
      return {
        success: true,
        vaultId: response.data.id,
        vaultName: response.data.name
      };
    } else {
      console.log('Mock mode or missing credentials, using mock implementation');
      
      // Return mock data
      const mockVaultId = `mock-vault-${Date.now()}`;
      return {
        success: true,
        vaultId: mockVaultId,
        vaultName: `Test Mock Vault ${new Date().toISOString()}`,
        isMock: true
      };
    }
  } catch (error) {
    console.error('Error creating vault with SDK:', error.message);
    if (error.response?.data) {
      console.error('API Error details:', error.response.data);
      console.error('Request ID:', error.response.headers['x-request-id']);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a vault using the application's utility functions
 * This demonstrates the approach using the application's abstraction layer
 */
async function createVaultWithUtilityFunctions() {
  try {
    console.log('\n----- TEST: Creating Vault with Utility Functions -----');
    console.log('Using mock mode:', USE_MOCK ? 'Yes' : 'No');
    
    const userId = 1; // Mock user ID for testing
    const issuerId = `test-issuer-${Date.now()}`; // Mock issuer ID
    const companyName = 'Test Company'; // Mock company name
    
    console.log(`Creating vault for issuer ${issuerId}, user ${userId}, company ${companyName}`);
    
    // Step 1: Create vault account
    const vaultResult = await createIssuerVaultAccount(userId, issuerId, companyName);
    
    if (!vaultResult.success) {
      console.error('Failed to create vault:', vaultResult.error);
      return vaultResult;
    }
    
    console.log('Vault created successfully:');
    console.log('Vault ID:', vaultResult.vaultId);
    console.log('Vault Name:', vaultResult.vaultName);
    
    // Step 2: Add asset to vault (e.g., ethereum)
    console.log('\nAdding ethereum asset to vault...');
    const blockchain = 'ethereum';
    const assetResult = await addAssetToVault(vaultResult.vaultId, blockchain, true);
    
    if (!assetResult.success) {
      console.error('Failed to add asset:', assetResult.error);
      return assetResult;
    }
    
    console.log('Asset added successfully:');
    console.log('Asset ID:', assetResult.assetId);
    console.log('Address:', assetResult.address);
    
    // Step 3: Create token (e.g., ERC20)
    console.log('\nCreating ERC20 token...');
    const tokenStandard = 'ERC20';
    const assetType = 'SECURITY_TOKEN';
    const tokenResult = await createToken(vaultResult.vaultId, blockchain, tokenStandard, assetType, companyName);
    
    if (!tokenResult.success) {
      console.error('Failed to create token:', tokenResult.error);
      return tokenResult;
    }
    
    console.log('Token created successfully:');
    console.log('Token ID:', tokenResult.tokenId);
    console.log('Token Name:', tokenResult.tokenName);
    
    return {
      success: true,
      vaultId: vaultResult.vaultId,
      assetId: assetResult.assetId,
      address: assetResult.address,
      tokenId: tokenResult.tokenId,
      isMock: vaultResult.isMock || assetResult.isMock || tokenResult.isMock
    };
  } catch (error) {
    console.error('Error creating vault with utility functions:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a complete issuer setup with database integration
 */
async function createCompleteIssuerSetup() {
  try {
    console.log('\n----- TEST: Creating Complete Issuer Setup with Database -----');
    console.log('Using mock mode:', USE_MOCK ? 'Yes' : 'No');
    
    // Step 1: Find or create a test issuer
    console.log('Finding or creating test issuer...');
    
    let issuer = await prisma.issuer.findFirst({
      where: {
        company_name: 'Test Company'
      }
    });
    
    if (!issuer) {
      console.log('Creating test issuer...');
      issuer = await prisma.issuer.create({
        data: {
          company_name: 'Test Company',
          legal_name: 'Test Company Legal Name',
          email: 'test@example.com',
          asset_type: 'SECURITY_TOKEN',
          blockchain: 'ethereum',
          token_standard: 'ERC20',
          setup_completed: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('Test issuer created:', issuer.id);
    } else {
      console.log('Using existing test issuer:', issuer.id);
    }
    
    // Step 2: Create vault account
    console.log('\nCreating vault account...');
    const vaultResult = await createIssuerVaultAccount(
      issuer.user_id || 1, // Use issuer's user ID or default to 1
      issuer.id,
      issuer.company_name
    );
    
    if (!vaultResult.success) {
      console.error('Failed to create vault:', vaultResult.error);
      return vaultResult;
    }
    
    console.log('Vault created successfully:');
    console.log('Vault ID:', vaultResult.vaultId);
    
    // Step 3: Add asset to vault
    console.log('\nAdding asset to vault...');
    const assetResult = await addAssetToVault(vaultResult.vaultId, issuer.blockchain, true);
    
    if (!assetResult.success) {
      console.error('Failed to add asset:', assetResult.error);
      return assetResult;
    }
    
    console.log('Asset added successfully:');
    console.log('Asset ID:', assetResult.assetId);
    console.log('Address:', assetResult.address);
    
    // Step 4: Create token if needed
    console.log('\nCreating token...');
    const tokenResult = await createToken(
      vaultResult.vaultId,
      issuer.blockchain,
      issuer.token_standard,
      issuer.asset_type,
      issuer.company_name
    );
    
    if (!tokenResult.success) {
      console.error('Failed to create token:', tokenResult.error);
      return tokenResult;
    }
    
    console.log('Token created successfully:');
    console.log('Token ID:', tokenResult.tokenId);
    
    // Step 5: Create or update wallet in database
    console.log('\nSaving wallet to database...');
    let wallet;
    
    const existingWallet = await prisma.wallet.findFirst({
      where: { issuer_id: issuer.id }
    });
    
    if (existingWallet) {
      console.log('Updating existing wallet...');
      wallet = await prisma.wallet.update({
        where: { id: existingWallet.id },
        data: {
          address: assetResult.address,
          chain: issuer.blockchain,
          type: issuer.token_standard,
          provider: 'fireblocks',
          is_active: true,
          is_custodial: true,
          fireblocks_vault_id: vaultResult.vaultId,
          fireblocks_vault_account_id: vaultResult.vaultId,
          fireblocks_asset_id: assetResult.assetId,
          deposit_address: assetResult.address,
          updated_at: new Date()
        }
      });
    } else {
      console.log('Creating new wallet...');
      wallet = await prisma.wallet.create({
        data: {
          user_id: issuer.user_id || 1,
          issuer_id: issuer.id,
          address: assetResult.address,
          chain: issuer.blockchain,
          type: issuer.token_standard,
          provider: 'fireblocks',
          is_active: true,
          is_custodial: true,
          fireblocks_vault_id: vaultResult.vaultId,
          fireblocks_vault_account_id: vaultResult.vaultId,
          fireblocks_asset_id: assetResult.assetId,
          deposit_address: assetResult.address,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
    
    console.log('Wallet saved successfully:', wallet.id);
    
    // Step 6: Update issuer setup status
    console.log('\nUpdating issuer setup status...');
    await prisma.issuer.update({
      where: { id: issuer.id },
      data: {
        setup_completed: true,
        setup_completed_at: new Date()
      }
    });
    
    console.log('\n✅ SUCCESS: Complete issuer setup finished');
    console.log('Issuer ID:', issuer.id);
    console.log('Vault ID:', vaultResult.vaultId);
    console.log('Wallet ID:', wallet.id);
    console.log('Wallet Address:', wallet.address);
    
    return {
      success: true,
      issuerId: issuer.id,
      vaultId: vaultResult.vaultId,
      walletId: wallet.id,
      walletAddress: wallet.address,
      isMock: vaultResult.isMock || assetResult.isMock || tokenResult.isMock
    };
  } catch (error) {
    console.error('\n❌ ERROR during complete issuer setup:', error.message);
    if (error.response?.data) {
      console.error('API Error details:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main test function to run all tests
 */
async function runAllTests() {
  try {
    console.log('===========================================');
    console.log('📊 FIREBLOCKS VAULT CREATION TEST');
    console.log('===========================================');
    console.log('Started at:', new Date().toISOString());
    console.log('Mock mode:', USE_MOCK ? 'ENABLED' : 'DISABLED');
    console.log('API Key:', FIREBLOCKS_API_KEY ? '✓ Set' : '✗ Not Set');
    console.log('Secret Path:', FIREBLOCKS_API_SECRET_PATH ? '✓ Set' : '✗ Not Set');
    console.log('Base URL:', BASE_URL);
    console.log('===========================================\n');
    
    // Run Test 1: Direct SDK usage
    const test1Result = await createVaultWithSDK();
    console.log('\nTest 1 Result:', test1Result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    // Run Test 2: Utility functions
    const test2Result = await createVaultWithUtilityFunctions();
    console.log('\nTest 2 Result:', test2Result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    // Run Test 3: Complete issuer setup with database
    const test3Result = await createCompleteIssuerSetup();
    console.log('\nTest 3 Result:', test3Result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    console.log('\n===========================================');
    console.log('TEST SUMMARY:');
    console.log('===========================================');
    console.log('Test 1 (Direct SDK):', test1Result.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Test 2 (Utility Functions):', test2Result.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Test 3 (Complete Setup):', test3Result.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('===========================================');
    
    return {
      success: test1Result.success && test2Result.success && test3Result.success,
      results: {
        test1: test1Result,
        test2: test2Result,
        test3: test3Result
      }
    };
  } catch (error) {
    console.error('\nUncaught error during tests:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then((results) => {
      console.log('\nTests completed with status:', results.success ? 'SUCCESS' : 'FAILED');
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error during test execution:', error);
      process.exit(1);
    });
}

// Export functions for use in other tests
module.exports = {
  createVaultWithSDK,
  createVaultWithUtilityFunctions,
  createCompleteIssuerSetup,
  runAllTests
}; 