/**
 * Script to find issuers in the system
 * Usage: node scripts/find_issuers.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findIssuers() {
  try {
    console.log('Searching for issuers in the system...');
    
    // Find all issuer roles
    const issuerRoles = await prisma.userrole.findMany({
      where: { role: 'ISSUER' },
      include: {
        user: true
      }
    });
    
    if (!issuerRoles || issuerRoles.length === 0) {
      console.log('No users with ISSUER role found');
      return;
    }
    
    console.log(`Found ${issuerRoles.length} users with ISSUER role:`);
    
    // Find all issuer profiles
    const issuerProfiles = await prisma.issuer.findMany({
      include: {
        user: true
      }
    });
    
    console.log('\n=== USERS WITH ISSUER ROLE ===');
    issuerRoles.forEach((role, index) => {
      console.log(`[${index + 1}] User ID: ${role.user_id}, Email: ${role.user?.email || 'N/A'}`);
    });
    
    console.log('\n=== ISSUER PROFILES ===');
    if (issuerProfiles.length === 0) {
      console.log('No issuer profiles found');
    } else {
      issuerProfiles.forEach((issuer, index) => {
        const hasWallet = 'wallet' in issuer && issuer.wallet !== null;
        const setupCompleted = issuer.setup_completed ? 'Yes' : 'No';
        
        console.log(`[${index + 1}] User ID: ${issuer.user_id}`);
        console.log(`    Company: ${issuer.company_name}`);
        console.log(`    Setup completed: ${setupCompleted}`);
        console.log(`    Selected blockchain: ${issuer.selected_blockchain || 'N/A'}`);
        console.log(`    Selected token standard: ${issuer.selected_token_standard || 'N/A'}`);
        console.log(`    Created: ${issuer.created_at}`);
        console.log('');
      });
    }
    
    console.log('\nTo create a wallet for an issuer, use:');
    console.log('node scripts/create_issuer_wallet.js <user_id>');
    
  } catch (error) {
    console.error('Error finding issuers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
findIssuers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 