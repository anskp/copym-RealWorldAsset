const { FireblocksSDK } = require('fireblocks-sdk');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Fireblocks API keys should be stored securely in environment variables
const FIREBLOCKS_API_KEY = process.env.FIREBLOCKS_API_KEY || '71b6cf18-6bb0-4766-a4d1-525725fe2764';
let FIREBLOCKS_API_SECRET;

try {
  // Check if the secret file path exists and try to read it
  const secretPath = process.env.FIREBLOCKS_API_SECRET_PATH || './fireblock.pem';
  if (fs.existsSync(secretPath)) {
    FIREBLOCKS_API_SECRET = fs.readFileSync(secretPath, 'utf8');
    console.log('Successfully loaded Fireblocks API secret from file');
  } else {
    // For development/testing purposes only
    console.warn('Fireblocks secret file not found. Using mock implementation.');
    FIREBLOCKS_API_SECRET = '-----BEGIN PRIVATE KEY-----\nMOCK_KEY_FOR_DEVELOPMENT\n-----END PRIVATE KEY-----';
  }
} catch (error) {
  console.error('Error loading Fireblocks API secret:', error);
  // For development/testing purposes only
  console.warn('Using mock implementation for Fireblocks SDK');
  FIREBLOCKS_API_SECRET = '-----BEGIN PRIVATE KEY-----\nMOCK_KEY_FOR_DEVELOPMENT\n-----END PRIVATE KEY-----';
}

// Generate a valid Ethereum address for mocks (0x + 40 hex characters)
const generateMockEthAddress = () => {
  return `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
};

// Initialize Fireblocks SDK with mock implementation for development
let fireblocks;

try {
  fireblocks = new FireblocksSDK(FIREBLOCKS_API_SECRET, FIREBLOCKS_API_KEY);
  console.log('Fireblocks SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Fireblocks SDK:', error);
  
  // Mock implementation for development/testing
  fireblocks = {
    // Mock the vaults API
    vaults: {
      // Mock createVaultAccount method
      createVaultAccount: async (params) => {
        console.log('MOCK: Creating vault account', params.createVaultAccountRequest || params);
        return {
          data: {
            id: 'mock-vault-' + Date.now(),
            name: params.createVaultAccountRequest?.name || 'Mock Vault',
            autoFuel: params.createVaultAccountRequest?.autoFuel || true,
            assets: []
          }
        };
      },
      // Mock createVaultAccountAsset method
      createVaultAccountAsset: async (params) => {
        console.log(`MOCK: Adding asset ${params.assetId} to vault ${params.vaultAccountId}`);
        return {
          id: params.assetId,
          balance: '0'
        };
      },
      // Mock createVaultAccountAssetAddress method
      createVaultAccountAssetAddress: async (params) => {
        console.log(`MOCK: Creating address for asset ${params.assetId} in vault ${params.vaultAccountId}`);
        return {
          address: generateMockEthAddress(),
          tag: null
        };
      }
    }
  };
  console.log('Using mock Fireblocks SDK for development');
}

// Asset type options and their allowed combinations
const ASSET_OPTIONS = {
  'GOLD': {
    name: 'Gold',
    blockchains: ['ethereum', 'polygon'],
    tokenStandards: {
      'ethereum': ['ERC-20', 'ERC-1400'],
      'polygon': ['ERC-20']
    }
  },
  'EQUITY': {
    name: 'Company Equity',
    blockchains: ['ethereum', 'polygon'],
    tokenStandards: {
      'ethereum': ['ERC-20', 'ERC-1400'],
      'polygon': ['ERC-20']
    }
  },
  'REAL_ESTATE': {
    name: 'Real Estate',
    blockchains: ['ethereum', 'polygon', 'solana'],
    tokenStandards: {
      'ethereum': ['ERC-20', 'ERC-721', 'ERC-1400'],
      'polygon': ['ERC-20', 'ERC-721'],
      'solana': ['SPL']
    }
  },
  'ART': {
    name: 'Art',
    blockchains: ['ethereum', 'polygon', 'solana'],
    tokenStandards: {
      'ethereum': ['ERC-721', 'ERC-1155'],
      'polygon': ['ERC-721', 'ERC-1155'],
      'solana': ['SPL']
    }
  },
  'CARBON_CREDITS': {
    name: 'Carbon Credits',
    blockchains: ['ethereum', 'polygon'],
    tokenStandards: {
      'ethereum': ['ERC-20', 'ERC-1400'],
      'polygon': ['ERC-20']
    }
  },
  'COMMODITIES': {
    name: 'Commodities',
    blockchains: ['ethereum', 'polygon'],
    tokenStandards: {
      'ethereum': ['ERC-20', 'ERC-1400'],
      'polygon': ['ERC-20']
    }
  }
};

// Configuration for different blockchain networks
const CHAIN_CONFIG = {
  'ethereum': {
    assetId: 'ETH_TEST5', // Upgraded from ETH_TEST which is deprecated
    name: 'Ethereum Testnet',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    chainId: '5',
    explorer: 'https://goerli.etherscan.io'
  },
  'polygon': {
    assetId: 'AMOY_POLYGON_TEST', // Polygon Amoy testnet
    name: 'Polygon Testnet',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    chainId: '80002',
    explorer: 'https://amoy.polygonscan.com'
  },
  'avalanche': {
    assetId: 'AVAXTEST',
    name: 'Avalanche Testnet',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    chainId: '43113',
    explorer: 'https://testnet.snowtrace.io'
  }
};

/**
 * Create a Fireblocks vault account for an issuer
 * @param {number} userId - User ID
 * @param {string} issuerId - Issuer ID
 * @param {string} companyName - Company name for the vault account
 * @returns {Promise<object>} - Created vault account information
 */
async function createIssuerVaultAccount(userId, issuerId, companyName) {
  try {
    // Input validation
    if (!userId || !issuerId || !companyName) {
      throw new Error('User ID, Issuer ID, and Company Name are required');
    }
    
    console.log(`Creating Fireblocks vault account for issuer ${issuerId}, user ${userId}, company ${companyName}`);
    
    // Check if fireblocks SDK is initialized
    if (!fireblocks || !fireblocks.vaults || typeof fireblocks.vaults.createVaultAccount !== 'function') {
      console.warn('Fireblocks SDK not properly initialized, using mock data');
      
      // Return mock vault account if SDK is not initialized
      return {
        success: true,
        vaultId: `mock-vault-${Date.now()}`,
        vaultName: `${companyName} Issuer Account (Mock)`,
        autoFuel: true,
        assets: []
      };
    }
    
    // Create the vault account
    const vaultAccount = await fireblocks.vaults.createVaultAccount({
      createVaultAccountRequest: {
        name: `${companyName} Issuer Account`,
        autoFuel: true,
        hiddenOnUI: false,
        customerRefId: `issuer-${issuerId}`
      }
    });
    
    console.log(`Successfully created vault account with ID: ${vaultAccount.data.id}`);
    
    // Return vault account information
    return {
      success: true,
      vaultId: vaultAccount.data.id,
      vaultName: vaultAccount.data.name,
      autoFuel: vaultAccount.data.autoFuel,
      assets: vaultAccount.data.assets || []
    };
  } catch (error) {
    console.error('Error creating Fireblocks vault account:', error);
    
    // Return a mock vault in case of error to allow development to continue
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock vault data due to error');
      return {
        success: true,
        vaultId: `mock-error-vault-${Date.now()}`,
        vaultName: `${companyName} Issuer Account (Error Mock)`,
        autoFuel: true,
        assets: [],
        isMock: true
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create vault account'
    };
  }
}

/**
 * Add an asset to a vault account based on selected blockchain
 * @param {string} vaultId - Fireblocks vault ID
 * @param {string} blockchain - Selected blockchain (ethereum, polygon, solana)
 * @param {boolean} isTestnet - Whether to use testnet asset
 * @returns {Promise<object>} - Created asset information
 */
async function addAssetToVault(vaultId, blockchain, isTestnet = true) {
  try {
    // Input validation
    if (!vaultId || !blockchain) {
      throw new Error('Vault ID and Blockchain are required');
    }
    
    if (!CHAIN_CONFIG[blockchain]) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
    
    // Get the asset ID based on blockchain and network type
    const assetId = isTestnet ? CHAIN_CONFIG[blockchain].testnet : CHAIN_CONFIG[blockchain].assetId;
    
    console.log(`Adding asset ${assetId} to vault account ${vaultId}`);
    
    // Check if fireblocks SDK is properly initialized
    if (!fireblocks || !fireblocks.vaults || 
        typeof fireblocks.vaults.createVaultAccountAsset !== 'function' ||
        typeof fireblocks.vaults.createVaultAccountAssetAddress !== 'function') {
      console.warn('Fireblocks SDK not properly initialized for asset operations, using mock data');
      return {
        success: true,
        assetId,
        address: generateMockEthAddress(),
        tag: null,
        isMock: true
      };
    }
    
    // Add the asset to the vault
    const vaultAsset = await fireblocks.vaults.createVaultAccountAsset({
      vaultAccountId: vaultId,
      assetId: assetId
    });
    
    console.log(`Successfully added asset ${assetId} to vault account ${vaultId}`);
    
    // Create a deposit address for the asset
    const depositAddress = await fireblocks.vaults.createVaultAccountAssetAddress({
      vaultAccountId: vaultId,
      assetId: assetId,
      createAddressRequest: {
        description: `${CHAIN_CONFIG[blockchain].name} deposit address`
      }
    });
    
    console.log(`Created deposit address for ${assetId}: ${depositAddress.address}`);
    
    // Return asset information
    return {
      success: true,
      assetId,
      address: depositAddress.address,
      tag: depositAddress.tag || null
    };
  } catch (error) {
    console.error('Error adding asset to vault:', error);
    
    // Return mock data in development to allow flow to continue
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock asset data due to error');
      return {
        success: true,
        assetId: isTestnet ? CHAIN_CONFIG[blockchain].testnet : CHAIN_CONFIG[blockchain].assetId,
        address: generateMockEthAddress(),
        tag: null,
        isMock: true
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to add asset to vault'
    };
  }
}

/**
 * Create a token based on token standard
 * @param {string} vaultId - Fireblocks vault ID
 * @param {string} blockchain - Selected blockchain (ethereum, polygon)
 * @param {string} tokenStandard - Selected token standard (ERC-20, ERC-721, etc.)
 * @param {string} assetType - Type of asset (GOLD, EQUITY, etc.)
 * @param {string} companyName - Company name for token name generation
 * @returns {Promise<object>} - Created token information
 */
async function createToken(vaultId, blockchain, tokenStandard, assetType, companyName) {
  try {
    // Input validation
    if (!vaultId || !blockchain || !tokenStandard || !assetType || !companyName) {
      throw new Error('All parameters are required for token creation');
    }
    
    if (!ASSET_OPTIONS[assetType]) {
      throw new Error(`Unsupported asset type: ${assetType}`);
    }
    
    if (!ASSET_OPTIONS[assetType].blockchains.includes(blockchain)) {
      throw new Error(`Blockchain ${blockchain} not supported for asset type ${assetType}`);
    }
    
    if (!ASSET_OPTIONS[assetType].tokenStandards[blockchain].includes(tokenStandard)) {
      throw new Error(`Token standard ${tokenStandard} not supported for blockchain ${blockchain} and asset type ${assetType}`);
    }
    
    console.log(`Creating ${tokenStandard} token on ${blockchain} for ${assetType} asset type`);
    
    // Generate token symbol safely
    const safeCompanyPrefix = companyName ? companyName.substring(0, 3).toUpperCase() : 'TKN';
    const safeAssetPrefix = assetType ? assetType.substring(0, 3) : 'AST';
    
    // This is a placeholder for actual token creation via Fireblocks
    // In a real implementation, you would call Fireblocks API to deploy a smart contract
    
    // Generate a fake contract address based on the parameters to simulate deployment
    const contractAddress = `0x${blockchain.substring(0, 2)}${tokenStandard.replace(/\D/g, '')}${Math.random().toString(16).slice(2, 36)}`;
    
    // Return placeholder for token creation response
    return {
      success: true,
      tokenName: `${companyName} ${ASSET_OPTIONS[assetType].name} Token`,
      tokenSymbol: `${safeCompanyPrefix}${safeAssetPrefix}`,
      tokenStandard,
      blockchain,
      contractAddress: contractAddress,
      isMock: true
    };
  } catch (error) {
    console.error('Error creating token:', error);
    
    // In development, return mock data to allow flow to continue
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock token data due to error');
      const safeCompanyPrefix = companyName ? companyName.substring(0, 3).toUpperCase() : 'TKN';
      const safeAssetPrefix = assetType ? assetType.substring(0, 3) : 'AST';
      
      return {
        success: true,
        tokenName: `${companyName || 'Default'} ${assetType || 'Asset'} Token`,
        tokenSymbol: `${safeCompanyPrefix}${safeAssetPrefix}`,
        tokenStandard: tokenStandard || 'ERC-20',
        blockchain: blockchain || 'ethereum',
        contractAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        isMock: true,
        isErrorRecovery: true
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create token'
    };
  }
}

/**
 * Get available asset type options
 * @returns {object} - Asset type options
 */
function getAssetTypeOptions() {
  return ASSET_OPTIONS;
}

/**
 * Get blockchain options for a specific asset type
 * @param {string} assetType - Asset type (GOLD, EQUITY, etc.)
 * @returns {array} - Available blockchain options
 */
function getBlockchainOptions(assetType) {
  if (!assetType || !ASSET_OPTIONS[assetType]) {
    return [];
  }
  
  return ASSET_OPTIONS[assetType].blockchains;
}

/**
 * Get token standard options for a specific asset type and blockchain
 * @param {string} assetType - Asset type (GOLD, EQUITY, etc.)
 * @param {string} blockchain - Selected blockchain (ethereum, polygon)
 * @returns {array} - Available token standard options
 */
function getTokenStandardOptions(assetType, blockchain) {
  if (!assetType || !blockchain || !ASSET_OPTIONS[assetType] || !ASSET_OPTIONS[assetType].tokenStandards[blockchain]) {
    return [];
  }
  
  return ASSET_OPTIONS[assetType].tokenStandards[blockchain];
}

/**
 * Get fireblocks asset ID for a given chain
 * @param {string} chain - Chain name (ethereum, polygon, avalanche)
 * @returns {string} Fireblocks asset ID
 */
const getFireblocksAssetId = (chain) => {
  if (!CHAIN_CONFIG[chain.toLowerCase()]) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return CHAIN_CONFIG[chain.toLowerCase()].assetId;
};

/**
 * Get chain name from asset ID
 * @param {string} assetId - Fireblocks asset ID
 * @returns {string} Chain name
 */
const getChainFromAssetId = (assetId) => {
  for (const [chain, config] of Object.entries(CHAIN_CONFIG)) {
    if (config.assetId === assetId) {
      return chain;
    }
  }
  throw new Error(`Unknown asset ID: ${assetId}`);
};

/**
 * Get token standards for a given chain
 * @param {string} chain - Chain name (ethereum, polygon, avalanche)
 * @returns {string[]} Supported token standards
 */
const getSupportedTokenStandards = (chain) => {
  if (!CHAIN_CONFIG[chain.toLowerCase()]) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return CHAIN_CONFIG[chain.toLowerCase()].tokenStandards;
};

/**
 * Get blockchain explorer URL for a given chain
 * @param {string} chain - Chain name (ethereum, polygon, avalanche)
 * @param {string} hash - Transaction or address hash
 * @param {string} type - Type of entity (tx, address)
 * @returns {string} Explorer URL
 */
const getExplorerUrl = (chain, hash, type = 'tx') => {
  if (!CHAIN_CONFIG[chain.toLowerCase()]) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  
  const baseUrl = CHAIN_CONFIG[chain.toLowerCase()].explorer;
  
  if (type === 'tx') {
    return `${baseUrl}/tx/${hash}`;
  } else if (type === 'address') {
    return `${baseUrl}/address/${hash}`;
  }
  
  return baseUrl;
};

module.exports = {
  createIssuerVaultAccount,
  addAssetToVault,
  createToken,
  getAssetTypeOptions,
  getBlockchainOptions,
  getTokenStandardOptions,
  ASSET_OPTIONS,
  CHAIN_CONFIG,
  getFireblocksAssetId,
  getChainFromAssetId,
  getSupportedTokenStandards,
  getExplorerUrl
}; 