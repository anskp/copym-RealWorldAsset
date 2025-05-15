# Real Fireblocks Vault Creation Guide

This guide explains how to create **real** vault accounts using the Fireblocks API without mock data. These scripts are designed to work with real API credentials and create actual vaults visible in your Fireblocks Console.

## Prerequisites

1. Fireblocks account with API access
2. API key and private key file from Fireblocks
3. Node.js v16 or higher
4. Properly set environment variables

## Environment Setup

Create or update your `.env` file with the following:

```
# Fireblocks API credentials - REQUIRED for real vault creation
FIREBLOCKS_API_KEY=your_api_key_here
FIREBLOCKS_API_SECRET_PATH=/absolute/path/to/your/fireblocks-private.key
FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io

# Set to 'false' or remove to use real API
USE_MOCK_FIREBLOCKS=false
```

> **Important**: The private key file must be a valid PEM file containing your Fireblocks API secret key.

## Available Scripts

We've created two scripts for creating real vaults:

1. **create-real-vault.js** - Creates a standalone vault and adds assets to it
2. **create-issuer-real-vault.js** - Creates a vault for a specific issuer and saves all details to the database

## Creating a Standalone Vault

This method creates a vault that isn't tied to your database records.

### Basic Usage

```bash
node backend/create-real-vault.js [customerId] [companyName]
```

### Parameters
- `customerId` (optional) - A customer reference ID for the vault (defaults to timestamp)
- `companyName` (optional) - The vault name prefix (defaults to "Test Issuer")

### Example
```bash
node backend/create-real-vault.js client123 "Acme Corp"
```

## Creating a Vault for Issuer

This method creates a vault for a specific issuer in your database and updates the issuer record.

### Basic Usage

```bash
node backend/create-issuer-real-vault.js <issuerId> [assetType] [blockchain] [tokenStandard]
```

### Parameters
- `issuerId` (required) - The ID of the issuer in your database
- `assetType` (optional) - The asset type (defaults to "SECURITY_TOKEN")
- `blockchain` (optional) - The blockchain to use (defaults to "ethereum")
- `tokenStandard` (optional) - The token standard (defaults to "ERC20")

### Example
```bash
node backend/create-issuer-real-vault.js abc123-456-def "SECURITY_TOKEN" "ethereum" "ERC20"
```

## Verification

After running either script, you should see the created vault in your Fireblocks Console. The vault will be visible because `hiddenOnUI` is set to `false`.

To verify that the vault was created and properly associated with your issuer:

1. Log in to your Fireblocks Console
2. Go to the Accounts section
3. Look for the newly created vault with the name matching your issuer's company name
4. Check that the assets were properly added
5. Verify that your database has been updated (for the issuer vault creation)

## Troubleshooting

### API Credentials Issues

If you see errors related to API credentials:

1. Verify that your API key is correct in the `.env` file
2. Check that the private key file exists at the specified path and is readable
3. Ensure the private key is in the correct format (PEM)
4. Check that your API key has the necessary permissions in Fireblocks

### Database Issues

If you encounter database-related errors:

1. Make sure the issuer ID exists in your database
2. Check that the `prisma.schema` file has all required fields for the wallet model
3. Ensure you have write permissions on the database

### Blockchain Asset Issues

If you encounter errors adding assets to the vault:

1. Verify that the asset ID is supported by Fireblocks (e.g., ETH_TEST, MATIC_TEST)
2. Check if your Fireblocks account has the selected asset enabled
3. For testnet assets, ensure you're using the correct asset ID with the _TEST suffix

## Additional Notes

1. Always test with sandbox/testnet before using mainnet
2. The vault will be created with `autoFuel` set to `true` for convenience
3. The vault will be visible in the Fireblocks Console (`hiddenOnUI = false`)
4. The scripts include detailed error reporting to help diagnose issues

## API Documentation

For more information about the Fireblocks API, visit:
- [Fireblocks API Documentation](https://docs.fireblocks.com/api/)
- [Fireblocks SDK GitHub Repository](https://github.com/fireblocks/fireblocks-sdk-js) 