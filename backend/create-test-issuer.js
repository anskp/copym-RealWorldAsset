require('dotenv').config();
const { prisma } = require('./config/prisma');

async function createTestIssuer() {
  try {
    console.log('Creating test user and issuer...');
    
    // Step 1: Check if the test user already exists
    let user = await prisma.users.findFirst({
      where: { email: 'testissuer@example.com' }
    });
    
    // Create user if it doesn't exist
    if (!user) {
      console.log('Creating test user...');
      user = await prisma.users.create({
        data: {
          email: 'testissuer@example.com',
          password: '$2a$10$4QvHm5SXZAR9HJAyX8OF3uD.U.0Ci9iYMZY7wtKD3da86hi6S67HK', // hashed password 'testpassword'
          first_name: 'Test',
          last_name: 'Issuer',
          is_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      console.log(`Created test user with ID: ${user.id}`);
      
      // Add issuer role
      await prisma.userrole.create({
        data: {
          user_id: user.id,
          role: 'issuer',
          created_at: new Date()
        }
      });
      
      console.log('Added issuer role to user');
    } else {
      console.log(`Using existing user with ID: ${user.id}`);
    }
    
    // Step 2: Check if the test issuer already exists
    let issuer = await prisma.issuer.findFirst({
      where: { user_id: user.id }
    });
    
    // Create issuer if it doesn't exist
    if (!issuer) {
      console.log('Creating test issuer...');
      issuer = await prisma.issuer.create({
        data: {
          id: 'test-issuer-id',
          user_id: user.id,
          company_name: 'Test Company',
          company_registration_number: 'TEST123456',
          jurisdiction: 'US',
          verification_status: true,
          verification_date: new Date(),
          is_active: true,
          registration_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          selected_asset_type: 'ETH_TEST',
          selected_blockchain: 'ethereum',
          selected_token_standard: 'ERC-20'
        }
      });
      
      console.log(`Created test issuer with ID: ${issuer.id}`);
    } else {
      console.log(`Using existing issuer with ID: ${issuer.id}`);
    }
    
    console.log('\n✅ Test user and issuer created successfully');
    console.log(`User ID: ${user.id}`);
    console.log(`Issuer ID: ${issuer.id}`);
    
  } catch (error) {
    console.error('\n❌ ERROR creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
createTestIssuer(); 