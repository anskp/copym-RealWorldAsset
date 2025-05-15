# Project Structure

## Backend

### Core Components
- `config/` - Configuration files for database, authentication, etc.
- `controllers/` - API route handlers
  - `admin/` - Admin-specific controllers
  - `auth/` - Authentication controllers
  - `crossmint/` - Crossmint integration
  - `fireblocks/` - Fireblocks custody integration
  - `investor/` - Investor-related controllers
  - `issuer/` - Issuer-related controllers
  - `issuer-vc/` - Issuer verifiable credentials
  - `sumsub/` - SumSub KYC integration
  - `wallet/` - Wallet management controllers
  - `webhooks/` - Webhook handlers
- `middleware/` - Express middleware functions
- `migrations/` - Database migrations
- `prisma/` - Prisma ORM files and schema
- `routes/` - API route definitions
- `services/` - Business logic implementation
- `utils/` - Helper functions and utilities

## Frontend

### Core Components
- `public/` - Static files
- `src/` - Source code
  - `api/` - API client functions
  - `components/` - React components
    - `admin/` - Admin interface components
    - `auth/` - Authentication components
    - `credentials/` - Credential display components
    - `dashboard/` - Dashboard components
    - `icons/` - Icon components
    - `issuer/` - Issuer interface components
    - `kyc/` - KYC flow components
    - `Layout/` - Page layout components
    - `Login/` - Login components
    - `wallet/` - Wallet-related components
  - `context/` - React context providers
  - `pages/` - Page components
  - `routes/` - Route definitions
  - `services/` - Frontend services
  - `utils/` - Utility functions

## Key Features

1. **Fireblocks Integration**
   - Wallet creation and management
   - Asset custody and transactions
   - Vault systems for issuers

2. **Issuer Management**
   - Real world asset tokenization
   - Token issuance and management
   - Credential verification

3. **Investor Interface**
   - Token purchase and management
   - KYC/AML integration with SumSub
   - Wallet connection and management 