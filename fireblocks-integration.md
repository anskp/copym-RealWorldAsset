# Fireblocks Integration

This document outlines how the Copym RWA platform integrates with Fireblocks for secure custody of digital assets.

## Overview

Fireblocks provides enterprise-grade infrastructure for storing, transferring, and issuing digital assets. Our platform utilizes Fireblocks for:

1. Creating and managing vault accounts for issuers
2. Managing wallets for various blockchain assets
3. Generating deposit addresses
4. Tracking balances and transactions
5. Ensuring secure custody of tokenized assets

## API Integration

The integration uses Fireblocks' REST API with JWT authentication:

```javascript
// Authentication example using JWT
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Load private key for signing JWT
const privateKey = fs.readFileSync(process.env.FIREBLOCKS_API_SECRET_PATH, 'utf8');

// Create signed JWT
const token = jwt.sign({ 
  uri: '/v1/vaults',
  nonce: Date.now(),
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 55, // 55 seconds expiration
  sub: process.env.FIREBLOCKS_API_KEY,
}, privateKey, { algorithm: 'RS256' });

// Make API request
const response = await axios.get('https://api.fireblocks.io/v1/vaults', {
  headers: {
    'X-API-Key': process.env.FIREBLOCKS_API_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Vault Management

The platform supports:

1. Creating vaults for issuers
2. Creating wallets within vaults for specific assets
3. Retrieving vault account information
4. Retrieving asset balances
5. Activating wallets
6. Renaming vaults

## Supported Blockchains

- Ethereum (ETH_TEST5)
- Polygon (AMOY_POLYGON_TEST)
- Avalanche (AVAXTEST)

## Backend Architecture

The integration uses a service-oriented architecture:

1. **Controllers**: Handle HTTP requests/responses
2. **Services**: Contain business logic for Fireblocks operations
3. **Utils**: Helper functions for API calls and data formatting

## Key Files

- `services/fireblocks.service.js`: Core Fireblocks API integration
- `controllers/fireblocks/vaults.controller.js`: API endpoints for vault operations
- `services/wallet/wallet.service.js`: Wallet management with Fireblocks
- `utils/fireblocksUtils.js`: Utilities for working with Fireblocks API

## Security Considerations

1. Private keys are stored securely and never exposed in the code
2. API secrets are stored in environment variables
3. JWT tokens are short-lived (55 seconds)
4. All API calls use HTTPS