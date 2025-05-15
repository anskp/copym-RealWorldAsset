# Fireblocks Vault Creation Solution

## Issue Identified

The original implementation of Fireblocks vault creation API was failing with 401 Unauthorized errors:

1. **Initial JWT-only authentication method**: Received `"Unauthorized: unexpected error."`
2. **API Key-only authentication method**: Received `"Unauthorized: JWT is missing"`

## Solution Found

After testing multiple authentication methods, we discovered that Fireblocks API requires **both JWT token and API Key** for successful authentication:

```javascript
// Headers that work
const headers = {
  'Authorization': `Bearer ${token}`,  // JWT token
  'X-API-Key': apiKey,                 // API key
  'Content-Type': 'application/json'
};
```

## Key Implementation Details

1. **JWT Token Creation**
   - Must properly format payload with all required fields
   - URL/path in JWT must exactly match the API endpoint (including query parameters)
   - Body hash must be calculated correctly

2. **Authentication Headers**
   - Include both `Authorization: Bearer ${jwt}` and `X-API-Key: ${apiKey}`
   - This combined approach is what makes the authentication work

3. **API Endpoint Notes**
   - The `/v1/vault/accounts` endpoint is deprecated; use `/v1/vault/accounts_paged` instead
   - Query parameters need to be included in the JWT token's path

## Testing Results

Our tests confirmed successful implementation of these API operations:

- ✅ **Vault Creation**: Successfully creates new vaults
- ✅ **Vault Retrieval**: Successfully retrieves vault details
- ✅ **Vault Renaming**: Successfully renames existing vaults
- ✅ **Wallet Creation**: Successfully adds wallets to vaults
- ✅ **Wallet Activation**: Successfully activates wallets
- ✅ **Balance Operations**: Successfully gets and refreshes balances
- ✅ **Vault Listing**: Successfully lists vaults using paginated endpoint

## Implementation Files

1. `services/fireblocks-vault-service.js`: Main service implementation with correct authentication
2. `test-vault-service.js`: Test script demonstrating all operations
3. `test-vault-all-auth-methods.js`: Testing script that compares different authentication methods

## Usage Example

```javascript
// Import the service
const fireblocksVaultService = require('./services/fireblocks-vault-service');

// Create a vault
const vault = await fireblocksVaultService.createVault({
  name: "My Vault",
  hiddenOnUI: false,
  customerRefId: "my-ref-123",
  autoFuel: false
});

// Get vault details
const vaultDetails = await fireblocksVaultService.getVault(vault.id);

// Create and activate a wallet
await fireblocksVaultService.createWallet(vault.id, "BTC_TEST");
await fireblocksVaultService.activateWallet(vault.id, "BTC_TEST");

// Get wallet balance
const balance = await fireblocksVaultService.getWalletBalance(vault.id, "BTC_TEST");
```

## Environment Setup

Required environment variables:
```
FIREBLOCKS_API_KEY=your_api_key
FIREBLOCKS_API_SECRET_PATH=./path/to/fireblock.pem
FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io
``` 