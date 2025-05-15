const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixWalletIdWithSql() {
  console.log('Starting wallet ID fix with direct SQL...');
  
  // Create database connection using the connection string
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  console.log('Connected to database');
  
  try {
    // Start transaction
    await connection.beginTransaction();
    console.log('Transaction started');
    
    // First, create a new wallet with auto-incrementing ID
    // We'll use direct SQL to copy from the existing UUID wallet
    const createSql = `
      INSERT INTO wallet
      (user_id, issuer_id, address, chain, type, provider, did, 
       external_id, is_active, is_custodial, created_at, updated_at,
       fireblocks_vault_id, fireblocks_vault_account_id, fireblocks_asset_id, deposit_address)
      SELECT 
        user_id, issuer_id, address, chain, type, provider, did,
        external_id, is_active, is_custodial, NOW(), NOW(),
        fireblocks_vault_id, fireblocks_vault_account_id, fireblocks_asset_id, deposit_address
      FROM wallet 
      WHERE id = 'ed44f795-948a-41b8-8206-0a263f46c7e9'
    `;
    
    const [createResult] = await connection.query(createSql);
    console.log('New wallet created with ID:', createResult.insertId);
    
    // Get the newly created wallet for verification
    const [newWallets] = await connection.execute(
      'SELECT * FROM wallet WHERE id = ?',
      [createResult.insertId]
    );
    
    if (newWallets.length === 0) {
      throw new Error('Failed to create new wallet');
    }
    
    console.log('New wallet successfully created:', newWallets[0]);
    
    // Now delete the UUID wallet
    const deleteSql = `
      DELETE FROM wallet
      WHERE id = 'ed44f795-948a-41b8-8206-0a263f46c7e9'
    `;
    
    const [deleteResult] = await connection.query(deleteSql);
    console.log('Delete result:', deleteResult);
    
    // Commit transaction
    await connection.commit();
    console.log('Transaction committed');
    
    // Final verification
    const [finalCheck] = await connection.execute(
      'SELECT * FROM wallet WHERE issuer_id = ?',
      [newWallets[0].issuer_id]
    );
    
    console.log('Final wallet state:', finalCheck);
    
  } catch (error) {
    // Rollback on error
    console.error('Error in transaction, rolling back:', error);
    await connection.rollback();
  } finally {
    // Close connection
    await connection.end();
    console.log('Database connection closed');
  }
}

// Run the script
fixWalletIdWithSql().catch(console.error); 