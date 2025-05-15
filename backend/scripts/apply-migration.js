const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration(sqlFilePath, description) {
  try {
    console.log(`Reading migration SQL file: ${sqlFilePath}...`);
    const migrationSql = fs.readFileSync(
      path.join(__dirname, sqlFilePath),
      'utf8'
    );
    
    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .filter(stmt => stmt.trim() !== '')
      .map(stmt => stmt.trim() + ';');
    
    console.log(`Found ${statements.length} SQL statements to execute for ${description}`);
    
    // Execute each statement
    for (const [index, statement] of statements.entries()) {
      console.log(`Executing statement ${index + 1}/${statements.length}:`);
      console.log(statement);
      
      try {
        // Execute raw SQL using Prisma
        await prisma.$executeRawUnsafe(statement);
        console.log('Statement executed successfully');
      } catch (sqlError) {
        // Check for specific error types
        if (sqlError.message && (
            sqlError.message.includes('Duplicate column name') || 
            sqlError.message.includes('already exists') ||
            sqlError.message.includes('Duplicate foreign key')
          )) {
          console.log(`Column already exists - skipping: ${sqlError.message}`);
        } else {
          console.error(`Error executing statement: ${sqlError.message}`);
        }
        // Continue with next statement even if this one fails
      }
    }
    
    console.log(`Migration ${description} completed`);
  } catch (error) {
    console.error(`Migration ${description} failed:`, error);
  }
}

async function applyAllMigrations() {
  try {
    // Define all migrations to apply
    const migrations = [
      { path: '../prisma/manual_migration.sql', description: 'Issuer setup fields' },
      { path: '../prisma/manual_migration_wallet.sql', description: 'Wallet fields' }
    ];
    
    // Apply each migration in sequence
    for (const migration of migrations) {
      await applyMigration(migration.path, migration.description);
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyAllMigrations(); 