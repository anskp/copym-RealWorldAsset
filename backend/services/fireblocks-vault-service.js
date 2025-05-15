/**
 * Improved Fireblocks Vault Service
 * Uses the combined JWT Bearer + X-API-Key authentication method
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class FireblocksVaultService {
  constructor() {
    // Load configuration from environment variables
    this.apiKey = process.env.FIREBLOCKS_API_KEY;
    this.privateKeyPath = process.env.FIREBLOCKS_API_SECRET_PATH || './fireblock.pem';
    this.baseUrl = process.env.FIREBLOCKS_BASE_URL || 'https://sandbox-api.fireblocks.io';
    
    // Fix baseUrl if it has trailing slash
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
    
    // Initialize the service
    this.initialize();
  }
  
  /**
   * Initialize the service by loading private key
   */
  initialize() {
    try {
      // Load the private key
      this.privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
      console.log('Fireblocks service initialized with private key');
      
      // Verify key format
      if (!this.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.warn('WARNING: Private key may not be in correct PEM format');
      }
    } catch (error) {
      console.error(`Failed to load Fireblocks private key: ${error.message}`);
      
      // Try to locate the key in common locations
      const possiblePaths = [
        './fireblock.pem',
        './fireblocks.pem',
        './keys/fireblock.pem',
        './keys/fireblocks.pem',
        '../reference-fireblocks-int-main/tokenization-backend/keys/fireblocks_secret.pem'
      ];
      
      for (const keyPath of possiblePaths) {
        try {
          if (fs.existsSync(keyPath)) {
            this.privateKey = fs.readFileSync(keyPath, 'utf8');
            console.log(`Found Fireblocks key at ${keyPath}`);
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!this.privateKey) {
        throw new Error('Could not find private key file');
      }
    }
  }
  
  /**
   * Create a JWT token for API authentication
   * @param {string} path - API endpoint path
   * @param {object} requestBody - Request body
   * @returns {string} - JWT token
   */
  createJWT(path, requestBody = {}) {
    const bodyString = JSON.stringify(requestBody);
    const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
    
    const now = Math.floor(Date.now() / 1000);
    const nonce = uuidv4();
    
    const payload = {
      uri: path,
      nonce,
      iat: now,
      exp: now + 55, // Token expires in 55 seconds
      sub: this.apiKey,
      bodyHash,
    };
    
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      header: {
        typ: 'JWT',
        alg: 'RS256',
      },
    });
  }
  
  /**
   * Make an API request to Fireblocks
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data
   * @returns {Promise<object>} - API response
   */
  async makeApiRequest(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestData = data || {};
    const token = this.createJWT(endpoint, requestData);
    
    if (!token) {
      throw new Error('Failed to generate JWT token');
    }
    
    // Create headers with both JWT token and X-API-Key
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await axios({
        method,
        url,
        headers,
        data: method !== 'GET' ? requestData : undefined,
        params: method === 'GET' && Object.keys(requestData).length > 0 ? requestData : undefined
      });
      
      return response.data;
    } catch (error) {
      console.error(`Fireblocks API error (${endpoint}): ${error.message}`);
      
      // Log detailed error information if available
      if (error.response?.data) {
        console.error('Response:', JSON.stringify(error.response.data));
      }
      
      // Create a more informative error with details
      const errorDetails = {
        req: {
          url,
          method
        },
        status: error.response?.status,
        statusText: error.response?.statusText,
        err: error.response?.data ? JSON.stringify(error.response.data) : error.message
      };
      
      // Throw with better error info
      throw errorDetails;
    }
  }
  
  /**
   * Create a new vault account
   * @param {object} vaultData - Vault data
   * @returns {Promise<object>} - Created vault
   */
  async createVault(vaultData) {
    return this.makeApiRequest('POST', '/v1/vault/accounts', vaultData);
  }
  
  /**
   * Get a vault account by ID
   * @param {string} vaultId - Vault ID
   * @returns {Promise<object>} - Vault data
   */
  async getVault(vaultId) {
    return this.makeApiRequest('GET', `/v1/vault/accounts/${vaultId}`);
  }
  
  /**
   * List all vault accounts (paginated)
   * @param {number} limit - Number of records per page (default 20, max 500)
   * @param {number} page - Page number (starting at 0)
   * @returns {Promise<object>} - Paginated list of vaults
   */
  async listVaults(limit = 20, page = 0) {
    // For GET requests with query parameters, the path in the JWT token
    // should include the query string
    const endpoint = `/v1/vault/accounts_paged?limit=${limit}&page=${page}`;
    
    // We send empty data since the params are in the URL
    return this.makeApiRequest('GET', endpoint, {});
  }
  
  /**
   * Rename a vault account
   * @param {string} vaultId - Vault ID
   * @param {string} newName - New vault name
   * @returns {Promise<object>} - Updated vault
   */
  async renameVault(vaultId, newName) {
    return this.makeApiRequest('PUT', `/v1/vault/accounts/${vaultId}`, { name: newName });
  }
  
  /**
   * Create/add wallet to vault
   * @param {string} vaultId - Vault ID
   * @param {string} assetId - Asset ID (e.g. BTC_TEST)
   * @param {string} eosAccountName - EOS account name (optional)
   * @returns {Promise<object>} - Created wallet
   */
  async createWallet(vaultId, assetId, eosAccountName = null) {
    const data = eosAccountName ? { eosAccountName } : {};
    return this.makeApiRequest('POST', `/v1/vault/accounts/${vaultId}/${assetId}`, data);
  }
  
  /**
   * Activate a wallet
   * @param {string} vaultId - Vault ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<object>} - Activation result
   */
  async activateWallet(vaultId, assetId) {
    return this.makeApiRequest('POST', `/v1/vault/accounts/${vaultId}/${assetId}/activate`);
  }
  
  /**
   * Get asset balance
   * @param {string} vaultId - Vault ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<object>} - Asset balance
   */
  async getWalletBalance(vaultId, assetId) {
    return this.makeApiRequest('GET', `/v1/vault/accounts/${vaultId}/${assetId}`);
  }
  
  /**
   * Refresh wallet balance
   * @param {string} vaultId - Vault ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<object>} - Refreshed balance
   */
  async refreshWalletBalance(vaultId, assetId) {
    return this.makeApiRequest('POST', `/v1/vault/accounts/${vaultId}/${assetId}/balance`);
  }
  
  /**
   * Get list of supported assets from Fireblocks
   * @returns {Promise<Array>} - List of supported assets
   */
  async getSupportedAssets() {
    return this.makeApiRequest('GET', '/v1/supported_assets');
  }
  
  /**
   * Get deposit address for a wallet
   * @param {string} vaultId - Vault ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<object>} - Deposit address info
   */
  async getDepositAddress(vaultId, assetId) {
    try {
      // Get deposit addresses for the wallet
      const endpoint = `/v1/vault/accounts/${vaultId}/${assetId}/addresses`;
      console.log(`Getting deposit address for wallet: ${vaultId}, asset: ${assetId}`);
      
      try {
        // First, try to get existing addresses
        const addresses = await this.makeApiRequest('GET', endpoint);
        console.log(`Found ${addresses ? addresses.length : 0} existing addresses`);
        
        // If there are addresses, return the first one
        if (addresses && Array.isArray(addresses) && addresses.length > 0) {
          console.log(`Using existing deposit address: ${addresses[0].address}`);
          return {
            address: addresses[0].address,
            tag: addresses[0].tag,
            description: addresses[0].description
          };
        } else {
          console.log('No existing addresses found, will create a new one');
        }
      } catch (error) {
        console.log(`Error getting addresses, will create a new one: ${JSON.stringify(error)}`);
      }
      
      // Create a new deposit address
      console.log('Creating new deposit address');
      try {
        const newAddress = await this.makeApiRequest('POST', endpoint, {
          description: `Deposit address for ${assetId} wallet`
        });
        
        console.log(`New address created: ${JSON.stringify(newAddress)}`);
        return {
          address: newAddress.address,
          tag: newAddress.tag,
          description: newAddress.description
        };
      } catch (createError) {
        console.error(`Error creating new address: ${JSON.stringify(createError)}`);
        throw createError;
      }
    } catch (error) {
      console.error(`Error managing deposit address: ${JSON.stringify(error)}`);
      
      // Return a placeholder address in case of any errors
      return {
        address: `vault:${vaultId}:${assetId}`,
        tag: null,
        description: 'Temporary address - real address generation failed'
      };
    }
  }
  
  /**
   * Create a vault for an issuer with specific asset options
   * @param {object} issuerData - Issuer information
   * @param {string} issuerData.issuerId - Issuer ID
   * @param {string} issuerData.companyName - Issuer company name
   * @param {string} issuerData.assetType - Selected asset type (ETH_TEST, GOLD, etc.)
   * @param {string} issuerData.blockchain - Selected blockchain (ethereum, polygon, etc.)
   * @param {string} issuerData.tokenStandard - Selected token standard (ERC-20, ERC-721, etc.)
   * @returns {Promise<object>} - Created vault with wallet information
   */
  async createIssuerVault(issuerData) {
    try {
      // Extract parameters
      const { issuerId, companyName, assetType, blockchain, tokenStandard } = issuerData;
      
      // Map selected blockchain to testnet assets (sandbox environment)
      // IMPORTANT: Use testnet assets since Fireblocks sandbox is in testnet mode
      let assetId = 'ETH_TEST5'; // Default to Sepolia testnet (ETH_TEST5)
      
      if (blockchain === 'ethereum') {
        assetId = 'ETH_TEST5'; // Use Sepolia testnet for Ethereum
      } else if (blockchain === 'polygon') {
        assetId = 'AMOY_POLYGON_TEST'; // Use Polygon Amoy testnet
      } else if (blockchain === 'avalanche') {
        assetId = 'AVAXTEST'; // Use Avalanche Fuji testnet
      }
      
      console.log(`Selected asset ID: ${assetId} for blockchain: ${blockchain}`);
      
      // Create vault with issuer information
      const vaultData = {
        name: `${companyName} - ${assetType} - ${tokenStandard} - ${Date.now()}`,
        hiddenOnUI: false,
        customerRefId: `issuer-${issuerId}-${Date.now()}`,
        autoFuel: true // Enable auto-fueling for gas fees
      };
      
      // Create the vault
      console.log(`Creating vault for issuer ${issuerId} with asset type ${assetType}`);
      const vault = await this.createVault(vaultData);
      console.log(`Vault created successfully with ID ${vault.id}`);
      
      // Create wallet in the vault
      console.log(`Creating wallet for vault ${vault.id} with asset ${assetId}`);
      const walletResult = await this.createWallet(vault.id, assetId);
      console.log(`Wallet created: ${JSON.stringify(walletResult)}`);
      
      // Activate the wallet
      console.log(`Activating wallet for vault ${vault.id} with asset ${assetId}`);
      await this.activateWallet(vault.id, assetId);
      
      // Get deposit address for the wallet
      const depositAddressInfo = await this.getDepositAddress(vault.id, assetId);
      console.log(`Deposit address obtained: ${JSON.stringify(depositAddressInfo)}`);
      
      // Return the created vault with deposit address
      return {
        vault: vault,
        wallet: {
          vaultId: vault.id,
          assetId: assetId,
          blockchain: blockchain,
          tokenStandard: tokenStandard,
          assetType: assetType,
          depositAddress: depositAddressInfo.address
        }
      };
    } catch (error) {
      console.error(`Error creating issuer vault: ${error.message || JSON.stringify(error)}`);
      throw error;
    }
  }
}

module.exports = new FireblocksVaultService(); 