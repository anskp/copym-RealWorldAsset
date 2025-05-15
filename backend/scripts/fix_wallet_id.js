const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixWalletId() {
  console.log('Starting wallet ID fix script...');
  
  // Create database connection using the connection string
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  console.log('Connected to database');
  
  try {
    // Get issuer ID from the problematic wallet
    const [walletRows] = await connection.execute(
      'SELECT * FROM wallet WHERE id = ?',
      ['ed44f795-948a-41b8-8206-0a263f46c7e9']
    );

    if (walletRows.length === 0) {
      console.log('No wallet with UUID found. Nothing to fix.');
      return;
    }

    const oldWallet = walletRows[0];
    console.log('Found wallet with UUID ID:', oldWallet);
    
    // Start transaction
    await connection.beginTransaction();
    
    // Delete the problematic wallet
    await connection.execute(
      'DELETE FROM wallet WHERE id = ?',
      ['ed44f795-948a-41b8-8206-0a263f46c7e9']
    );
    console.log('Deleted wallet with UUID ID');
    
    // Ensure all values are either their value or null (not undefined)
    const params = [
      oldWallet.user_id,
      oldWallet.issuer_id,
      oldWallet.address,
      oldWallet.type || 'evm-mpc-wallet',
      oldWallet.chain || 'ethereum',
      oldWallet.provider || 'fireblocks',
      oldWallet.did === undefined ? null : oldWallet.did,
      oldWallet.external_id === undefined ? null : oldWallet.external_id,
      oldWallet.is_active !== undefined ? oldWallet.is_active : 1,
      oldWallet.is_custodial !== undefined ? oldWallet.is_custodial : 1,
      oldWallet.fireblocks_vault_id === undefined ? null : oldWallet.fireblocks_vault_id,
      oldWallet.fireblocks_vault_account_id === undefined ? null : oldWallet.fireblocks_vault_account_id,
      oldWallet.fireblocks_asset_id === undefined ? null : oldWallet.fireblocks_asset_id,
      oldWallet.deposit_address === undefined ? null : oldWallet.deposit_address
    ];
    
    console.log('Insert parameters:', params);
    
    // Create new wallet with auto-incrementing ID
    const [insertResult] = await connection.execute(
      `INSERT INTO wallet 
       (user_id, issuer_id, address, type, chain, provider, did, 
        external_id, is_active, is_custodial, created_at, updated_at, 
        fireblocks_vault_id, fireblocks_vault_account_id, fireblocks_asset_id, deposit_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?)`,
      params
    );
    
    // Commit transaction
    await connection.commit();
    
    console.log('Created new wallet with auto-increment ID:', insertResult.insertId);
    
    // Verify the new wallet
    const [newWalletRows] = await connection.execute(
      'SELECT * FROM wallet WHERE id = ?',
      [insertResult.insertId]
    );
    
    console.log('New wallet created successfully:', newWalletRows[0]);
    
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('Error fixing wallet ID:', error);
  } finally {
    // Close connection
    await connection.end();
    console.log('Database connection closed');
  }
}

// Run the script
fixWalletId().catch(console.error); 