/**
 * Utility functions for working with Fireblocks API
 */

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
  CHAIN_CONFIG,
  getFireblocksAssetId,
  getChainFromAssetId,
  getSupportedTokenStandards,
  getExplorerUrl
};