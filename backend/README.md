# Copym RWA Backend

This is the backend service for the Copym Real World Asset tokenization platform.

## Features

- RESTful API for asset management
- Fireblocks integration for secure wallet management
- Authentication and authorization
- KYC/AML integration with SumSub
- Database integration with PostgreSQL using Prisma ORM

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Set up environment variables
   ```
   cp ../.env.example .env
   ```
   
3. Set up the database
   ```
   npx prisma migrate dev
   ```

4. Start the development server
   ```
   npm run dev
   ```

## API Documentation

API endpoints are organized by domain:

- `/api/auth` - Authentication and user management
- `/api/issuer` - Issuer-related operations
- `/api/investor` - Investor-related operations
- `/api/fireblocks` - Fireblocks integrations
- `/api/wallet` - Wallet management