# Copym RWA Frontend

This is the frontend application for the Copym Real World Asset tokenization platform.

## Features

- User interfaces for issuers and investors
- Wallet integration and management
- Asset issuance and credential management
- KYC flow integration
- Responsive design for desktop and mobile

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Set up environment variables
   ```
   cp ../.env.example .env
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Build for production
   ```
   npm run build
   ```

## Component Structure

The frontend application is organized by domain:

- `components/admin` - Admin interfaces
- `components/auth` - Authentication components
- `components/credentials` - Credential display and management
- `components/dashboard` - Dashboard components
- `components/issuer` - Issuer-specific components
- `components/kyc` - KYC flow components
- `components/wallet` - Wallet management components

## Technologies

- React.js for UI components
- React Router for navigation
- Axios for API requests
- Tailwind CSS for styling
- JWT for authentication