require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Create a temporary .env.test file for SQLite database
function createTestConfig() {
  try {
    console.log('Creating test database configuration...');
    
    // Create test .env file
    const testEnvPath = path.join(__dirname, '.env.test');
    const testEnvContent = `
# Test Database Configuration - using SQLite
DATABASE_URL="file:./test.db"

# Fireblocks Configuration
FIREBLOCKS_API_KEY=test-api-key
FIREBLOCKS_API_SECRET_PATH=./fireblock.pem
FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io
USE_MOCK_FIREBLOCKS=true
    `;
    
    fs.writeFileSync(testEnvPath, testEnvContent.trim());
    console.log(`Test env file created at: ${testEnvPath}`);
    
    // Create test prisma schema
    const prismaSchemaPath = path.join(__dirname, 'prisma', 'schema.test.prisma');
    
    // Read the existing schema
    const originalSchema = fs.readFileSync(path.join(__dirname, 'prisma', 'schema.prisma'), 'utf8');
    
    // Replace the datasource with SQLite
    const sqliteSchema = originalSchema.replace(
      /datasource db {[^}]*}/s,
      `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
    );
    
    fs.writeFileSync(prismaSchemaPath, sqliteSchema);
    console.log(`Test Prisma schema created at: ${prismaSchemaPath}`);
    
    console.log('\n✅ Test database configuration completed');
    console.log('Run tests with: DATABASE_URL="file:./test.db" npx prisma db push --schema=./prisma/schema.test.prisma');
    
  } catch (error) {
    console.error('\n❌ ERROR creating test configuration:', error);
  }
}

// Run the setup
createTestConfig(); 