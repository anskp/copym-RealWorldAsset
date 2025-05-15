# Fireblocks Vault Creation Guide

This document provides instructions for creating Issuer vaults using the Fireblocks API through various methods provided in this codebase.

## Prerequisites

1. Node.js v16 or higher
2. Fireblocks API credentials (or mock mode enabled)
3. Environment variables properly configured

## Environment Configuration

Create or update your `.env` file with the following variables:

```
# Fireblocks API credentials
FIREBLOCKS_API_KEY=your_api_key
FIREBLOCKS_API_SECRET_PATH=path/to/your/fireblocks.pem
FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io

# Set to 'true' to use mock implementation instead of real API calls
USE_MOCK_FIREBLOCKS=false
```

For development purposes, you can set `USE_MOCK_FIREBLOCKS=true` to use mock implementations without real API calls.

## Available Methods

There are three methods for creating vaults:

1. **Direct SDK method** - Uses the Fireblocks SDK directly
2. **Utility Functions** - Uses the abstraction layer provided by our utility functions
3. **Complete Setup** - Creates a full issuer setup including database entries and wallet configuration

## Using the CLI Script

The `create-issuer-vault.js` script provides a convenient command-line interface for creating vaults.

### Basic Usage

```bash
node create-issuer-vault.js [options]
```

### Options

- `--mock` - Force mock mode regardless of environment settings
- `--method=<method>` - Choose the method: `direct`, `utility`, or `complete` (default)
- `--issuer=<issuerId>` - Specify an issuer ID to use (only for the complete method)

### Examples

```bash
# Create a vault using the complete setup method with mock mode
node create-issuer-vault.js --mock

# Create a vault using direct SDK method
node create-issuer-vault.js --method=direct

# Create a vault using utility functions
node create-issuer-vault.js --method=utility

# Create a vault for a specific issuer
node create-issuer-vault.js --issuer=your-issuer-id
```

## Running Tests

The `fireblocks-vault-creation.test.js` file contains tests for the various vault creation methods.

### Running All Tests

```bash
node tests/fireblocks-vault-creation.test.js
```

### Importing Test Functions in Other Files

You can import the test functions in other files:

```javascript
const { 
  createVaultWithSDK, 
  createVaultWithUtilityFunctions, 
  createCompleteIssuerSetup,
  runAllTests 
} = require('./tests/fireblocks-vault-creation.test');

// Example usage
async function testVaultCreation() {
  const result = await createVaultWithSDK();
  console.log(result);
}
```

## Troubleshooting

### Mock Mode Not Working

If mock mode isn't working as expected:

1. Check the `USE_MOCK_FIREBLOCKS` environment variable is set to `'true'` (string)
2. Verify that the mock implementation is properly set up in utilities
3. Use the `--mock` flag with the CLI script to force mock mode

### API Connection Issues

If you're having issues connecting to the Fireblocks API:

1. Verify your API key is correct
2. Check that your private key file exists and is readable
3. Ensure the base URL is correct for your environment (sandbox vs production)
4. Check for any network-related issues (firewalls, proxies, etc.)

### Database Errors

If you encounter database-related errors:

1. Ensure Prisma is properly set up and the database is accessible
2. Check that all required tables and fields exist in your database
3. Make sure the issuer exists if you're specifying an issuer ID

## Additional Resources

- [Fireblocks API Documentation](https://docs.fireblocks.com/api/)
- [Fireblocks SDK GitHub Repository](https://github.com/fireblocks/fireblocks-sdk-js) 