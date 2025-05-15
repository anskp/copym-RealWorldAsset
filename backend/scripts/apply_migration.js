const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyMigration() {
  try {
    console.log('Starting migration to fix wallet IDs...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/20250514000001_fix_wallet_external_id/migration.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements by semicolon
    const statements = migrationSql
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Create a direct connection to MySQL
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database');
    
    // Begin transaction
    await connection.beginTransaction();
    console.log('Transaction started');
    
    try {
      // Execute each statement
      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement) {
          console.log(`Executing: ${trimmedStatement.substring(0, 50)}...`);
          await connection.execute(trimmedStatement);
        }
      }
      
      // Commit the transaction
      await connection.commit();
      console.log('Migration applied successfully, transaction committed');
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      console.error('Error applying migration, rolling back:', error);
      throw error;
    } finally {
      // Close connection
      await connection.end();
    }
    
    console.log('Migration complete. Now running Prisma generate to update client...');
    
    // Create a Prisma client instance
    const prisma = new PrismaClient();
    
    // Test connection after migration
    try {
      const walletCount = await prisma.wallet.count();
      console.log(`Database connection successful. Wallet count: ${walletCount}`);
      
      // Check schema
      console.log('Checking wallet schema...');
      const wallets = await prisma.wallet.findMany({
        take: 1
      });
      
      if (wallets.length > 0) {
        console.log('Sample wallet:', wallets[0]);
      } else {
        console.log('No wallets found in database');
      }
    } catch (error) {
      console.error('Error testing database connection:', error);
    } finally {
      await prisma.$disconnect();
    }
    
    console.log('Migration process completed');
  } catch (error) {
    console.error('Failed to apply migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration(); 