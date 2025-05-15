const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkWallets() {
  console.log('Starting wallet check script...');
  
  // Create database connection using the connection string
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  console.log('Connected to database');
  
  try {
    // Check if the UUID wallet still exists
    const [uuidWallets] = await connection.execute(
      "SELECT * FROM wallet WHERE id = 'ed44f795-948a-41b8-8206-0a263f46c7e9'"
    );

    if (uuidWallets.length > 0) {
      console.log('Wallet with UUID still exists:', uuidWallets[0]);
    } else {
      console.log('No wallet with UUID found - good!');
    }
    
    // Get the issuer ID that we need to check for
    const [issuers] = await connection.execute(
      "SELECT * FROM issuer WHERE id = '2d4d8def-563e-4957-ae46-02893ac339eb'"
    );

    if (issuers.length > 0) {
      console.log('Found issuer:', issuers[0]);
      
      // Check if there's a wallet with issuer_id
      const [issuerWallets] = await connection.execute(
        "SELECT * FROM wallet WHERE issuer_id = '2d4d8def-563e-4957-ae46-02893ac339eb'"
      );
      
      if (issuerWallets.length > 0) {
        console.log('Found wallets for issuer:', issuerWallets);
      } else {
        console.log('No wallets found for this issuer');
      }
    } else {
      console.log('Issuer not found');
    }
    
    // Check all wallets in the system
    const [allWallets] = await connection.execute("SELECT * FROM wallet");
    console.log('Total wallets in system:', allWallets.length);
    allWallets.forEach(wallet => {
      console.log(`Wallet ID: ${wallet.id}, Type: ${typeof wallet.id}, Issuer ID: ${wallet.issuer_id}`);
    });
    
  } catch (error) {
    console.error('Error checking wallets:', error);
  } finally {
    // Close connection
    await connection.end();
    console.log('Database connection closed');
  }
}

// Run the script
checkWallets().catch(console.error); 