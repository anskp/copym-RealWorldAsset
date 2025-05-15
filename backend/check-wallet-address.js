/**
 * Check Wallet Addresses Script
 * 
 * This script checks for invalid wallet addresses in the database and fixes them.
 * Run this script if you're seeing 400 Bad Request errors when accessing wallet data.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate a valid Ethereum address for mocks (0x + 40 hex characters)
const generateMockEthAddress = () => {
  return `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
};

// Check if an address is valid (0x + 40 hex characters)
const isValidEthAddress = (address) => {
  if (!address) return false;
  // Must start with 0x and be followed by 40 hex characters
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

async function checkAndFixWalletAddresses() {
  console.log('======================================================');
  console.log('🔍 CHECKING WALLET ADDRESSES IN DATABASE');
  console.log('======================================================');
  
  try {
    // Get all wallets
    const wallets = await prisma.wallet.findMany();
    console.log(`Found ${wallets.length} wallets in database`);
    
    // Track fixed wallets
    let fixedCount = 0;
    
    // Check each wallet
    for (const wallet of wallets) {
      let needsUpdate = false;
      const updates = {};
      
      // Check main address
      if (!isValidEthAddress(wallet.address)) {
        console.log(`Invalid address for wallet ID ${wallet.id}: ${wallet.address}`);
        updates.address = generateMockEthAddress();
        needsUpdate = true;
      }
      
      // Check deposit address if it exists
      if (wallet.deposit_address && !isValidEthAddress(wallet.deposit_address)) {
        console.log(`Invalid deposit_address for wallet ID ${wallet.id}: ${wallet.deposit_address}`);
        updates.deposit_address = updates.address || generateMockEthAddress();
        needsUpdate = true;
      }
      
      // Update if needed
      if (needsUpdate) {
        console.log(`Updating wallet ID ${wallet.id} with valid addresses...`);
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: updates
        });
        fixedCount++;
        console.log(`✅ Fixed wallet ID ${wallet.id}`);
      }
    }
    
    console.log('\n======================================================');
    if (fixedCount > 0) {
      console.log(`✅ FIXED ${fixedCount} WALLETS WITH INVALID ADDRESSES`);
    } else {
      console.log('✅ ALL WALLET ADDRESSES ARE VALID');
    }
    console.log('======================================================');
    
  } catch (error) {
    console.error('Error checking wallet addresses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAndFixWalletAddresses()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 