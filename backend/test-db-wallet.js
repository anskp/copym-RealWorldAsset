const { prisma } = require('./config/prisma');

// Test to create a wallet directly in the database
async function testCreateWalletInDb() {
  try {
    console.log('Starting database wallet creation test...');
    
    // Get an issuer to test with
    const issuer = await prisma.issuer.findFirst({
      include: { users: true }
    });
    
    if (!issuer) {
      console.log('No issuer found in database');
      return;
    }
    
    console.log(`Testing with issuer ID: ${issuer.id}, user ID: ${issuer.user_id}`);
    
    // Create a wallet for the issuer directly in the database
    const wallet = await prisma.wallet.create({
      data: {
        user_id: issuer.user_id,
        issuer_id: issuer.id,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        type: 'ERC20',
        chain: 'ethereum',
        provider: 'fireblocks',
        is_active: true,
        is_custodial: true,
        external_id: `ext-${Math.random().toString(36).substr(2, 10)}`,
        fireblocks_vault_id: `vault-${Math.random().toString(36).substr(2, 10)}`,
        fireblocks_vault_account_id: `account-${Math.random().toString(36).substr(2, 10)}`,
        fireblocks_asset_id: 'ETH_TEST',
        deposit_address: `0x${Math.random().toString(16).substr(2, 40)}`,
        updated_at: new Date()
      }
    });
    
    console.log('Wallet created successfully:', wallet);
    
    // Verify the wallet was saved in the database
    const dbWallet = await prisma.wallet.findFirst({
      where: { issuer_id: issuer.id }
    });
    
    console.log('Database wallet:', dbWallet);
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}

// Run the test
testCreateWalletInDb(); 