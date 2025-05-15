/**
 * Script to create a test issuer user and profile
 * Usage: node scripts/create_test_issuer.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const TEST_PASSWORD = 'Password123!';

async function createTestIssuer() {
  try {
    console.log('Creating test issuer account and profile...');
    
    // Generate a unique email
    const timestamp = Date.now();
    const email = `test.issuer.${timestamp}@example.com`;
    
    // Create user with a simple hashed password (for testing only)
    const hashedPassword = crypto.createHash('sha256').update(TEST_PASSWORD).digest('hex');
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
    const userRole = await prisma.userrole.create({
      data: {
        user_id: user.id,
        role: 'ISSUER',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log(`Assigned ISSUER role to user ID: ${user.id}`);
    
    // Create issuer profile
    const issuer = await prisma.issuer.create({
      data: {
        user_id: user.id,
        company_name: 'Test Company',
        company_website: 'https://example.com',
        setup_completed: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log(`Created issuer profile for company: ${issuer.company_name} (ID: ${issuer.id})`);
    
    console.log('\nTest Issuer Created:');
    console.log('---------------------');
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${TEST_PASSWORD} (Note: actual login won't work with this password due to hashing method)`);
    console.log(`Company: ${issuer.company_name}`);
    console.log('\nTo create a wallet for this issuer, use:');
    console.log(`node scripts/create_issuer_wallet.js ${user.id}`);
    
    return user.id;
  } catch (error) {
    console.error('Error creating test issuer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createTestIssuer()
  .then(userId => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 