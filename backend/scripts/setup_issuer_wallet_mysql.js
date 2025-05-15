/**
 * Setup issuer wallet - MySQL version
 * Creates wallets for issuers in the database
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

// Constants
const DEFAULT_ASSET_TYPE = 'security_token';
const DEFAULT_BLOCKCHAIN = 'ethereum';
const DEFAULT_TOKEN_STANDARD = 'ERC20';

// Get database connection info from environment
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL environment variable not found');
  process.exit(1);
}

// Parse connection string
function parseConnectionString(connectionString) {
  try {
    // mysql://user:password@host:port/database
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = connectionString.match(regex);
    
    if (!match) {
      throw new Error('Invalid MySQL connection string format');
    }
    
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5]
    };
  } catch (error) {
    console.error('Error parsing connection string:', error.message);
    throw error;
  }
}

// Mock data generator functions
function generateMockAddress() {
  return `0x${Math.random().toString(16).substr(2, 40)}`;
}

function generateMockVaultId() {
  return `mock-vault-${Date.now()}`;
}

function generateMockAccountId() {
  return `mock-account-${Date.now()}`;
}

// Main function
async function main() {
  console.log('MySQL Issuer Wallet Setup Tool');
  console.log('=============================');
  
  // Parse connection info
  const connectionInfo = parseConnectionString(DB_URL);
  console.log(`Connecting to MySQL database: ${connectionInfo.database}`);
  
  // Create connection
  let connection;
  try {
    connection = await mysql.createConnection({
      host: connectionInfo.host,
      user: connectionInfo.user,
      password: connectionInfo.password,
      database: connectionInfo.database,
      port: connectionInfo.port,
      multipleStatements: true
    });
    
    console.log('Successfully connected to MySQL database');
    
    // 1. Get all issuers
    const [issuers] = await connection.execute('SELECT * FROM Issuer');
    console.log(`Found ${issuers.length} issuers in the database`);
    
    // Print issuer details
    console.log('\nIssuer details:');
    issuers.forEach((issuer, i) => {
      console.log(`  ${i + 1}. ID: ${issuer.id}`);
      console.log(`     Company: ${issuer.company_name || 'Unnamed'}`);
      console.log(`     Setup completed: ${issuer.setup_completed ? 'Yes' : 'No'}`);
      console.log(`     User ID: ${issuer.user_id || 'N/A'}`);
    });
    
    if (issuers.length === 0) {
      console.log('No issuers found in the database. Exiting.');
      return;
    }
    
    // 2. Get all wallets
    const [wallets] = await connection.execute('SELECT * FROM Wallet');
    console.log(`\nFound ${wallets.length} wallets in the database`);
    
    // Print wallet details
    if (wallets.length > 0) {
      console.log('\nExisting wallet details:');
      wallets.forEach((wallet, i) => {
        console.log(`  ${i + 1}. ID: ${wallet.id}`);
        console.log(`     Issuer ID: ${wallet.issuer_id}`);
        console.log(`     Address: ${wallet.address}`);
      });
    }
    
    // 3. Process each issuer
    for (const issuer of issuers) {
      console.log(`\nProcessing issuer: ${issuer.id} (${issuer.company_name || 'Unnamed'})`);
      
      // Check if issuer already has a wallet
      const existingWallet = wallets.find(w => w.issuer_id === issuer.id);
      if (existingWallet) {
        console.log(`  Issuer already has wallet ${existingWallet.id}`);
        continue;
      }
      
      try {
        // Create a wallet
        console.log('  Creating new wallet...');
        
        // Prepare data
        const address = generateMockAddress();
        const vaultId = generateMockVaultId();
        const accountId = generateMockAccountId();
        const depositAddress = generateMockAddress();
        const now = new Date();
        
        console.log('  Generated mock data:');
        console.log(`    Address: ${address}`);
        console.log(`    Vault ID: ${vaultId}`);
        console.log(`    Account ID: ${accountId}`);
        
        // Build the columns and values for the SQL query
        const columns = [
          'issuer_id',
          'address',
          'chain',
          'type',
          'provider',
          'is_active',
          'is_custodial',
          'created_at',
          'updated_at',
          'fireblocks_vault_id',
          'fireblocks_vault_account_id',
          'fireblocks_asset_id',
          'deposit_address'
        ];
        
        const values = [
          issuer.id,
          address,
          DEFAULT_BLOCKCHAIN,
          DEFAULT_TOKEN_STANDARD,
          'mock',
          1,
          1,
          now,
          now,
          vaultId,
          accountId,
          'ETH_TEST',
          depositAddress
        ];
        
        // Add user_id if available
        if (issuer.user_id) {
          columns.push('user_id');
          values.push(issuer.user_id);
          console.log(`  Including user_id: ${issuer.user_id}`);
        }
        
        // Create the SQL insert with the correct number of placeholders
        const placeholders = values.map(() => '?').join(', ');
        const sql = `INSERT INTO Wallet (${columns.join(', ')}) VALUES (${placeholders})`;
        
        console.log('  Executing SQL insert...');
        
        // Insert wallet
        const [result] = await connection.execute(sql, values);
        const walletId = result.insertId;
        console.log(`  Created wallet with ID: ${walletId}`);
        
        // Update issuer record
        console.log('  Updating issuer record with setup completion...');
        await connection.execute(
          `UPDATE Issuer SET 
            selected_asset_type = ?,
            selected_blockchain = ?,
            selected_token_standard = ?,
            setup_completed = 1,
            setup_completed_at = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            DEFAULT_ASSET_TYPE,
            DEFAULT_BLOCKCHAIN,
            DEFAULT_TOKEN_STANDARD,
            now,
            now,
            issuer.id
          ]
        );
        
        console.log('  Setup completed successfully');
      } catch (error) {
        console.error(`  Error processing issuer ${issuer.id}:`, error.message);
        console.error('  Full error:', error);
      }
    }
    
    // 4. Show summary
    const [updatedIssuers] = await connection.execute('SELECT * FROM Issuer WHERE setup_completed = 1');
    const [allWallets] = await connection.execute('SELECT * FROM Wallet');
    
    console.log('\nSummary:');
    console.log('==========');
    console.log(`Total issuers: ${issuers.length}`);
    console.log(`Issuers with completed setup: ${updatedIssuers.length}`);
    console.log(`Total wallets: ${allWallets.length}`);
    
    // Show the most recent wallet created
    if (allWallets.length > 0) {
      const latestWallet = allWallets[allWallets.length - 1];
      const latestIssuer = issuers.find(i => i.id === latestWallet.issuer_id);
      
      console.log('\nMost recent wallet:');
      console.log(`  Wallet ID: ${latestWallet.id}`);
      console.log(`  Issuer ID: ${latestWallet.issuer_id}`);
      console.log(`  Company: ${latestIssuer ? latestIssuer.company_name : 'Unknown'}`);
      console.log(`  Wallet Address: ${latestWallet.address}`);
      console.log(`  Blockchain: ${latestWallet.chain}`);
      if (latestWallet.type) console.log(`  Token Standard: ${latestWallet.type}`);
      if (latestWallet.fireblocks_vault_id) console.log(`  Vault ID: ${latestWallet.fireblocks_vault_id}`);
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the script
main()
  .then(() => console.log('Script completed'))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 