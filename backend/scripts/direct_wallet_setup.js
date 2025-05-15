/**
 * Direct wallet setup script
 * This script bypasses Prisma to directly analyze and update the database
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Constants
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const DEFAULT_ASSET_TYPE = 'security_token';
const DEFAULT_BLOCKCHAIN = 'ethereum';
const DEFAULT_TOKEN_STANDARD = 'ERC20';

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

function generateRegistrationNumber() {
  return `REG${Date.now()}`;
}

async function main() {
  console.log('Direct Wallet Setup Tool');
  console.log('=======================');

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database file not found at: ${DB_PATH}`);
    console.error('This script requires a SQLite database at:', DB_PATH);
    console.error('Checking for PostgreSQL database...');
    const pgUrl = process.env.DATABASE_URL || '';
    if (pgUrl.startsWith('postgres')) {
      console.log('PostgreSQL database detected in environment. This script only supports SQLite databases.');
      console.log('Please use the Prisma API or create a wallet via the API.');
      return;
    }
    return;
  }

  console.log(`Found database at: ${DB_PATH}`);
  
  // Connect to database
  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
      process.exit(1);
    }
    console.log('Connected to the SQLite database');
  });
  
  // Use promises for database operations
  const dbRun = (query, params) => {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };
  
  const dbGet = (query, params) => {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };
  
  const dbAll = (query, params) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };
  
  try {
    // List available tables
    console.log('\nAnalyzing database schema...');
    const tables = await dbAll(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'",
      []
    );
    
    if (tables.length === 0) {
      console.error('No tables found in the database');
      return;
    }
    
    console.log('Available tables:');
    tables.forEach((table, i) => {
      console.log(`  ${i + 1}. ${table.name}`);
    });
    
    // Check if issuer table exists
    const issuerTableExists = tables.some(t => t.name.toLowerCase() === 'issuer');
    const walletTableExists = tables.some(t => t.name.toLowerCase() === 'wallet');
    
    if (!issuerTableExists) {
      console.error('Issuer table not found in the database');
      return;
    }
    
    if (!walletTableExists) {
      console.error('Wallet table not found in the database');
      return;
    }
    
    // Get all issuers
    const issuers = await dbAll('SELECT * FROM Issuer', []);
    let targetIssuers = [...issuers];
    
    if (issuers.length === 0) {
      console.log('No issuers found in the database. Creating a test issuer...');
      
      // First, analyze the User table if it exists
      let userId = null;
      if (tables.some(t => t.name.toLowerCase() === 'user')) {
        // Get user table structure
        const userColumns = await dbAll('PRAGMA table_info(User)', []);
        console.log('\nUser table structure:');
        userColumns.forEach((col) => {
          console.log(`  ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
        });
        
        // Try to find or create a user
        const users = await dbAll('SELECT * FROM User', []);
        if (users.length > 0) {
          // Use an existing user
          const user = users[0];
          userId = user.id;
          console.log(`Using existing user with ID: ${userId}`);
        } else {
          // Create a new user if possible
          try {
            // Determine required fields
            const requiredFields = {};
            userColumns
              .filter(col => col.notnull && !col.pk)
              .forEach(col => {
                switch(col.name) {
                  case 'email':
                    requiredFields.email = `test.user.${Date.now()}@example.com`;
                    break;
                  case 'password':
                    requiredFields.password = Buffer.from('password123').toString('hex');
                    break;
                  case 'first_name':
                    requiredFields.first_name = 'Test';
                    break;
                  case 'last_name':
                    requiredFields.last_name = 'User';
                    break;
                  case 'is_verified':
                    requiredFields.is_verified = true;
                    break;
                  case 'created_at':
                    requiredFields.created_at = new Date().toISOString();
                    break;
                  case 'updated_at':
                    requiredFields.updated_at = new Date().toISOString();
                    break;
                  default:
                    if (col.type.toLowerCase() === 'text' || col.type.toLowerCase().includes('char')) {
                      requiredFields[col.name] = `test_${col.name}`;
                    } else if (col.type.toLowerCase().includes('int')) {
                      requiredFields[col.name] = 1;
                    } else if (col.type.toLowerCase().includes('bool')) {
                      requiredFields[col.name] = true;
                    }
                }
              });
            
            // Build the SQL query
            const fields = Object.keys(requiredFields);
            const placeholders = fields.map(() => '?');
            const values = fields.map(field => requiredFields[field]);
            
            const sql = `INSERT INTO User (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            
            const result = await dbRun(sql, values);
            userId = result.lastID;
            console.log(`Created new user with ID: ${userId}`);
            
            // Create user role if applicable
            if (tables.some(t => t.name.toLowerCase() === 'userrole')) {
              try {
                await dbRun(
                  'INSERT INTO UserRole (user_id, role, created_at, updated_at) VALUES (?, ?, ?, ?)',
                  [userId, 'ISSUER', new Date().toISOString(), new Date().toISOString()]
                );
                console.log(`Assigned ISSUER role to user ${userId}`);
              } catch (roleErr) {
                console.error('Error creating user role:', roleErr);
              }
            }
            
          } catch (userErr) {
            console.error('Error creating new user:', userErr);
            console.log('Will create issuer without user reference');
          }
        }
      }
      
      // Analyze issuer table
      const issuerColumns = await dbAll('PRAGMA table_info(Issuer)', []);
      console.log('\nIssuer table structure:');
      issuerColumns.forEach((col) => {
        console.log(`  ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
      });
      
      // Create a test issuer
      try {
        // Determine required fields
        const requiredFields = {};
        issuerColumns
          .filter(col => col.notnull && !col.pk)
          .forEach(col => {
            switch(col.name) {
              case 'user_id':
                if (userId) requiredFields.user_id = userId;
                break;
              case 'company_name':
                requiredFields.company_name = 'Test Company';
                break;
              case 'company_website':
                requiredFields.company_website = 'https://example.com';
                break;
              case 'company_registration_number':
                requiredFields.company_registration_number = generateRegistrationNumber();
                break;
              case 'setup_completed':
                requiredFields.setup_completed = false;
                break;
              case 'created_at':
                requiredFields.created_at = new Date().toISOString();
                break;
              case 'updated_at':
                requiredFields.updated_at = new Date().toISOString();
                break;
              default:
                if (col.type.toLowerCase() === 'text' || col.type.toLowerCase().includes('char')) {
                  requiredFields[col.name] = `test_${col.name}`;
                } else if (col.type.toLowerCase().includes('int')) {
                  requiredFields[col.name] = 1;
                } else if (col.type.toLowerCase().includes('bool')) {
                  requiredFields[col.name] = true;
                }
            }
          });
        
        // Skip if user_id is required but not available
        if (issuerColumns.some(col => col.name === 'user_id' && col.notnull) && !userId) {
          console.error('Cannot create issuer: user_id is required but no user is available');
          return;
        }
        
        // Build the SQL query
        const fields = Object.keys(requiredFields);
        const placeholders = fields.map(() => '?');
        const values = fields.map(field => requiredFields[field]);
        
        const sql = `INSERT INTO Issuer (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
        
        const result = await dbRun(sql, values);
        const issuerId = result.lastID;
        console.log(`Created test issuer with ID: ${issuerId}`);
        
        // Add to target issuers
        targetIssuers.push({
          id: issuerId,
          company_name: requiredFields.company_name,
          user_id: userId,
          ...requiredFields
        });
        
      } catch (issuerErr) {
        console.error('Error creating test issuer:', issuerErr);
        console.error('Cannot continue without an issuer');
        return;
      }
    } else {
      console.log(`\nFound ${issuers.length} issuers:`);
      issuers.forEach((issuer, i) => {
        console.log(`  ${i + 1}. ID: ${issuer.id}, Company: ${issuer.company_name || 'Unnamed'}`);
      });
    }
    
    // Get wallet table structure
    const walletStructure = await dbAll('PRAGMA table_info(Wallet)', []);
    console.log('\nWallet table structure:');
    walletStructure.forEach((col) => {
      console.log(`  ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
    });
    
    // Check for existing wallets
    const wallets = await dbAll('SELECT * FROM Wallet', []);
    console.log(`\nFound ${wallets.length} wallets in the database`);
    
    // Create wallets for issuers that don't have one
    console.log('\nCreating wallets for issuers that need them...');
    
    for (const issuer of targetIssuers) {
      // Check if issuer already has a wallet
      const existingWallet = wallets.find(w => w.issuer_id === issuer.id);
      
      if (existingWallet) {
        console.log(`Issuer ${issuer.id} already has wallet ${existingWallet.id}`);
        continue;
      }
      
      console.log(`Creating wallet for issuer ${issuer.id}...`);
      
      // Prepare required wallet fields
      const walletFields = {};
      
      // Add required fields based on schema
      walletStructure
        .filter(col => col.notnull && !col.pk)
        .forEach(col => {
          switch(col.name) {
            case 'issuer_id':
              walletFields.issuer_id = issuer.id;
              break;
            case 'user_id':
              if (issuer.user_id) walletFields.user_id = issuer.user_id;
              break;
            case 'address':
              walletFields.address = generateMockAddress();
              break;
            case 'chain':
              walletFields.chain = DEFAULT_BLOCKCHAIN;
              break;
            case 'created_at':
              walletFields.created_at = new Date().toISOString();
              break;
            case 'updated_at':
              walletFields.updated_at = new Date().toISOString();
              break;
            default:
              if (col.type.toLowerCase() === 'text' || col.type.toLowerCase().includes('char')) {
                walletFields[col.name] = `test_${col.name}`;
              } else if (col.type.toLowerCase().includes('int')) {
                walletFields[col.name] = 1;
              } else if (col.type.toLowerCase().includes('bool')) {
                walletFields[col.name] = true;
              }
          }
        });
      
      // Add optional fields that appear in the schema
      const optionalFields = {
        type: DEFAULT_TOKEN_STANDARD,
        provider: 'mock',
        is_active: true,
        is_custodial: true,
        fireblocks_vault_id: generateMockVaultId(),
        fireblocks_vault_account_id: generateMockAccountId(),
        fireblocks_asset_id: 'ETH_TEST',
        deposit_address: generateMockAddress()
      };
      
      // Add optional fields only if they exist in the schema
      for (const [key, value] of Object.entries(optionalFields)) {
        if (walletStructure.some(col => col.name === key)) {
          walletFields[key] = value;
        }
      }
      
      // Skip if user_id is required but not available
      if (walletStructure.some(col => col.name === 'user_id' && col.notnull) && !issuer.user_id) {
        console.error(`Cannot create wallet for issuer ${issuer.id}: user_id is required but not available`);
        continue;
      }
      
      // Build the SQL query dynamically based on available fields
      const fields = Object.keys(walletFields);
      const placeholders = fields.map(() => '?');
      const values = fields.map(field => walletFields[field]);
      
      const sql = `INSERT INTO Wallet (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
      
      try {
        const result = await dbRun(sql, values);
        console.log(`Created wallet with ID: ${result.lastID}`);
        
        // Update issuer with setup completion
        const setupFields = {
          setup_completed: true,
          setup_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Add asset selection fields if they exist in the schema
        const issuerColumns = await dbAll('PRAGMA table_info(Issuer)', []);
        if (issuerColumns.some(col => col.name === 'selected_asset_type')) {
          setupFields.selected_asset_type = DEFAULT_ASSET_TYPE;
        }
        if (issuerColumns.some(col => col.name === 'selected_blockchain')) {
          setupFields.selected_blockchain = DEFAULT_BLOCKCHAIN;
        }
        if (issuerColumns.some(col => col.name === 'selected_token_standard')) {
          setupFields.selected_token_standard = DEFAULT_TOKEN_STANDARD;
        }
        
        // Build the update query
        const updateFields = Object.keys(setupFields).map(f => `${f} = ?`);
        const updateValues = Object.values(setupFields);
        
        await dbRun(
          `UPDATE Issuer SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, issuer.id]
        );
        
        console.log(`Updated issuer ${issuer.id} with setup completion`);
      } catch (insertError) {
        console.error(`Error creating wallet for issuer ${issuer.id}:`, insertError);
      }
    }
    
    console.log('\nWallet setup complete!');
    
    // Display a summary
    console.log('\nSummary:');
    console.log('---------');
    const updatedIssuers = await dbAll('SELECT * FROM Issuer WHERE setup_completed = 1', []);
    const updatedWallets = await dbAll('SELECT * FROM Wallet', []);
    console.log(`Total issuers with setup completed: ${updatedIssuers.length}`);
    console.log(`Total wallets created: ${updatedWallets.length}`);
    
    // Show the most recent wallet created
    if (updatedWallets.length > 0) {
      const latestWallet = updatedWallets[updatedWallets.length - 1];
      const latestIssuer = updatedIssuers.find(i => i.id === latestWallet.issuer_id);
      
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
    console.error('Error:', error);
  } finally {
    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

main(); 