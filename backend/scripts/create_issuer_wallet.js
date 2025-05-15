/**
 * Script to create a vault and wallet for an issuer using the mock functionality
 * Usage: 
 *   node scripts/create_issuer_wallet.js           # Create new test issuer with wallet
 *   node scripts/create_issuer_wallet.js <user_id> # Create wallet for existing issuer
 *   node scripts/create_issuer_wallet.js --issuer <issuer_id> # Create wallet for existing issuer by issuer ID
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

// Default values
const DEFAULT_ASSET_TYPE = 'security_token';
const DEFAULT_BLOCKCHAIN = 'ethereum';
const DEFAULT_TOKEN_STANDARD = 'ERC20';
const TEST_PASSWORD = 'Password123!';

/**
 * Create a test issuer account and profile
 */
async function createTestIssuer() {
  try {
    console.log('Creating test issuer account and profile...');
    
    // Generate a unique email and registration number
    const timestamp = Date.now();
    const email = `test.issuer.${timestamp}@example.com`;
    const regNumber = `REG${timestamp}`;
    
    // Create user with a simple hashed password (for testing only)
    const hashedPassword = crypto.createHash('sha256').update(TEST_PASSWORD).digest('hex');
    
    // Check if user model exists in schema
    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          first_name: 'Test',
          last_name: 'Issuer',
          is_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      console.log(`Created test user: ${user.email} (ID: ${user.id})`);
      
      // Assign issuer role
      await prisma.userrole.create({
        data: {
          user_id: user.id,
          role: 'ISSUER',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      console.log(`Assigned ISSUER role to user ID: ${user.id}`);
      
      // Create issuer profile with required fields
      const issuer = await prisma.issuer.create({
        data: {
          user_id: user.id,
          company_name: 'Test Company',
          company_website: 'https://example.com',
          company_registration_number: regNumber,
          setup_completed: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      console.log(`Created issuer profile for company: ${issuer.company_name} (ID: ${issuer.id})`);
      
      return user.id;
    } catch (error) {
      console.error('Error creating test user or issuer:', error);
      
      // Attempt to create a simplified test issuer directly
      console.log('Attempting to create simplified test issuer...');
      
      // Generate a unique registration number
      const regNumber = `REG${Date.now()}`;
      
      // Get schema information to see what fields are required
      try {
        const issuer = await prisma.issuer.create({
          data: {
            company_name: 'Test Company',
            company_website: 'https://example.com',
            company_registration_number: regNumber, // Added required field
            setup_completed: false,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        
        console.log(`Created simplified issuer profile (ID: ${issuer.id})`);
        return issuer.id;
      } catch (schemaError) {
        console.error('Schema error when creating issuer:', schemaError);
        
        // Try to inspect the schema
        console.log('Attempting to determine required fields from error message...');
        
        // Extract required fields from error message if possible
        const errorMsg = schemaError.message || '';
        const missingFields = {};
        
        if (errorMsg.includes('Argument `user_id` is missing')) {
          missingFields.user_id = 1; // Mock ID as placeholder
        }
        
        // Try one more time with all possible fields we can infer
        try {
          const issuer = await prisma.issuer.create({
            data: {
              company_name: 'Test Company',
              company_website: 'https://example.com',
              company_registration_number: regNumber,
              ...missingFields,
              setup_completed: false,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          
          console.log(`Created issuer with inferred fields (ID: ${issuer.id})`);
          return issuer.id;
        } catch (finalError) {
          console.error('Final attempt to create issuer failed:', finalError);
          throw finalError;
        }
      }
    }
  } catch (error) {
    console.error('Could not create test issuer:', error);
    throw error;
  }
}

/**
 * Create mock wallet for issuer using raw SQL
 */
async function createIssuerWallet(userId, isDirectIssuerId = false) {
  try {
    console.log(`Creating mock wallet for ${isDirectIssuerId ? 'issuer' : 'user'} ID: ${userId}`);
    
    // Find issuer record
    let issuer;
    if (isDirectIssuerId) {
      issuer = await prisma.issuer.findUnique({
        where: { id: userId }
      });
    } else {
      issuer = await prisma.issuer.findFirst({
        where: { user_id: userId }
      });
    }
    
    if (!issuer) {
      console.error(`Issuer not found for ${isDirectIssuerId ? 'issuer' : 'user'} ID: ${userId}`);
      return { success: false, error: 'Issuer not found' };
    }
    
    console.log(`Found issuer: ${issuer.company_name || 'Unnamed'} (ID: ${issuer.id})`);
    
    // Check if wallet exists using raw SQL
    const existingWallets = await prisma.$queryRaw`
      SELECT * FROM Wallet WHERE issuer_id = ${issuer.id}
    `;
    
    if (existingWallets && existingWallets.length > 0) {
      const wallet = existingWallets[0];
      console.log(`Wallet already exists for this issuer: ${wallet.id}`);
      return { success: true, message: 'Wallet already exists', wallet };
    }
    
    // Generate mock data
    const walletId = uuidv4();
    const address = `0x${Math.random().toString(16).substr(2, 40)}`;
    const vaultId = `mock-vault-${Date.now()}`;
    const accountId = `mock-account-${Date.now()}`;
    const depositAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
    const now = new Date();
    
    console.log(`Generated wallet ID: ${walletId}`);
    
    // Create wallet using raw SQL
    try {
      // Try with all fields
      const result = await prisma.$executeRaw`
        INSERT INTO Wallet (
          id,
          issuer_id,
          address,
          chain,
          type,
          provider,
          is_active,
          is_custodial,
          created_at,
          updated_at,
          fireblocks_vault_id,
          fireblocks_vault_account_id,
          fireblocks_asset_id,
          deposit_address,
          user_id
        ) VALUES (
          ${walletId},
          ${issuer.id},
          ${address},
          ${DEFAULT_BLOCKCHAIN},
          ${DEFAULT_TOKEN_STANDARD},
          'mock',
          1,
          1,
          ${now},
          ${now},
          ${vaultId},
          ${accountId},
          'ETH_TEST',
          ${depositAddress},
          ${issuer.user_id || null}
        )
      `;
      
      console.log(`Created wallet, rows affected: ${result}`);
    } catch (error) {
      console.error('Error creating wallet:', error);
      
      // Try with minimal fields
      try {
        const result = await prisma.$executeRaw`
          INSERT INTO Wallet (
            id,
            issuer_id,
            address,
            chain,
            created_at,
            updated_at
          ) VALUES (
            ${walletId},
            ${issuer.id},
            ${address},
            ${DEFAULT_BLOCKCHAIN},
            ${now},
            ${now}
          )
        `;
        
        console.log(`Created minimal wallet, rows affected: ${result}`);
      } catch (minimalError) {
        console.error('Error creating minimal wallet:', minimalError);
        throw minimalError;
      }
    }
    
    // Get the created wallet
    const createdWallets = await prisma.$queryRaw`
      SELECT * FROM Wallet WHERE id = ${walletId}
    `;
    
    if (!createdWallets || createdWallets.length === 0) {
      throw new Error('Wallet was not created');
    }
    
    const wallet = createdWallets[0];
    console.log('Created mock wallet:', wallet);
    
    // Update issuer record
    await prisma.issuer.update({
      where: { id: issuer.id },
      data: {
        selected_asset_type: DEFAULT_ASSET_TYPE,
        selected_blockchain: DEFAULT_BLOCKCHAIN,
        selected_token_standard: DEFAULT_TOKEN_STANDARD,
        setup_completed: true,
        setup_completed_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('Updated issuer record with setup completion');
    
    return {
      success: true,
      message: 'Wallet and vault created successfully',
      wallet: {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        type: wallet.type,
        vault_id: wallet.fireblocks_vault_id
      },
      issuer: {
        id: issuer.id,
        company_name: issuer.company_name,
        setup_completed: true
      }
    };
  } catch (error) {
    console.error('Error creating issuer wallet:', error);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    // Parse command line arguments
    let userId = null;
    let isDirectIssuerId = false;
    
    if (process.argv.includes('--issuer')) {
      const issuerIndex = process.argv.indexOf('--issuer');
      if (issuerIndex + 1 < process.argv.length) {
        userId = process.argv[issuerIndex + 1];
        isDirectIssuerId = true;
        console.log(`Using provided issuer ID: ${userId}`);
      }
    } else if (process.argv.length > 2) {
      userId = process.argv[2];
      console.log(`Using provided user ID: ${userId}`);
    }
    
    if (!userId) {
      console.log('No ID provided, creating test issuer...');
      userId = await createTestIssuer();
      isDirectIssuerId = true;
      
      if (!userId) {
        console.error('Failed to create test issuer');
        process.exit(1);
      }
    }
    
    // Create wallet
    const result = await createIssuerWallet(userId, isDirectIssuerId);
    
    console.log('\nOperation result:', result);
    
    if (result.success) {
      console.log('\nSUCCESS: Wallet and vault created successfully');
      console.log('---------------------------------------------');
      console.log(`Issuer ID: ${result.issuer.id}`);
      console.log(`Wallet ID: ${result.wallet.id}`);
      console.log(`Wallet Address: ${result.wallet.address}`);
      console.log(`Blockchain: ${result.wallet.chain}`);
      console.log(`Token Standard: ${result.wallet.type || DEFAULT_TOKEN_STANDARD}`);
      if (result.wallet.vault_id) {
        console.log(`Vault ID: ${result.wallet.vault_id}`);
      }
    } else {
      console.error('\nFAILED: Could not create wallet and vault');
      console.error(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 