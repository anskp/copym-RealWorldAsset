const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { CHAIN_CONFIG, getFireblocksAssetId } = require('../utils/fireblocksUtils');

const prisma = new PrismaClient();

class FireblocksService {
  constructor() {
    this.baseUrl = process.env.FIREBLOCKS_API_URL || 'https://api.fireblocks.io';
    this.apiKey = process.env.FIREBLOCKS_API_KEY;
    this.apiSecretPath = process.env.FIREBLOCKS_API_SECRET_PATH;
  }

  /**
   * Generate a JWT token for Fireblocks API authentication
   * @param {string} uri - API endpoint URI
   * @returns {string} JWT token
   */
  generateToken(uri) {
    try {
      // Check if API key and secret path are configured
      if (!this.apiKey || !this.apiSecretPath) {
        throw new Error('Fireblocks API key or secret path not configured');
      }

      // Load private key
      const privateKey = fs.readFileSync(this.apiSecretPath, 'utf8');

      // Create JWT token
      const token = jwt.sign({
        uri,
        nonce: Date.now(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 55, // 55 seconds expiration
        sub: this.apiKey,
      }, privateKey, { algorithm: 'RS256' });

      return token;
    } catch (error) {
      console.error('Error generating JWT token:', error);
      throw new Error(`Failed to generate authentication token: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Fireblocks API
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data
   * @returns {Promise<object>} API response
   */
  async makeRequest(method, endpoint, data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const uri = endpoint.split('?')[0]; // Remove query parameters for JWT generation
      
      const token = this.generateToken(uri);
      
      const headers = {
        'X-API-Key': this.apiKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const config = {
        method,
        url,
        headers,
        ...(data && { data })
      };
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Fireblocks API error (${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a vault account
   * @param {object} vaultData - Vault account data
   * @returns {Promise<object>} Created vault account
   */
  async createVaultAccount(vaultData) {
    return this.makeRequest('POST', '/v1/vault/accounts', vaultData);
  }

  /**
   * Get vault account by ID
   * @param {string} vaultId - Vault account ID
   * @returns {Promise<object>} Vault account data
   */
  async getVaultAccount(vaultId) {
    return this.makeRequest('GET', `/v1/vault/accounts/${vaultId}`);
  }

  /**
   * Create wallet in vault
   * @param {string} vaultId - Vault account ID
   * @param {string} assetId - Asset ID
   * @param {object} extraParams - Additional parameters
   * @returns {Promise<object>} Created wallet data
   */
  async createWallet(vaultId, assetId, extraParams = {}) {
    return this.makeRequest('POST', `/v1/vault/accounts/${vaultId}/${assetId}`, extraParams);
  }

  /**
   * Activate wallet in vault
   * @param {string} vaultId - Vault account ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<object>} Activation result
   */
  async activateWallet(vaultId, assetId) {
    return this.makeRequest('POST', `/v1/vault/accounts/${vaultId}/${assetId}/activate`);
  }

  /**
   * Get deposit address for wallet
   * @param {string} vaultId - Vault account ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<object>} Deposit address
   */
  async getDepositAddress(vaultId, assetId) {
    return this.makeRequest('GET', `/v1/vault/accounts/${vaultId}/${assetId}/addresses?limit=1`);
  }

  /**
   * Rename vault account
   * @param {string} vaultId - Vault account ID
   * @param {string} name - New name
   * @returns {Promise<object>} Update result
   */
  async renameVaultAccount(vaultId, name) {
    return this.makeRequest('PUT', `/v1/vault/accounts/${vaultId}`, { name });
  }

  /**
   * Get vault asset balance
   * @param {string} vaultId - Vault account ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<object>} Asset balance
   */
  async getVaultAssetBalance(vaultId, assetId) {
    return this.makeRequest('GET', `/v1/vault/accounts/${vaultId}/${assetId}`);
  }

  /**
   * Refresh vault asset balance
   * @param {string} vaultId - Vault account ID
   * @param {string} assetId - Asset ID
   * @returns {Promise<object>} Refresh result
   */
  async refreshVaultAssetBalance(vaultId, assetId) {
    return this.makeRequest('POST', `/v1/vault/accounts/${vaultId}/${assetId}/balance`);
  }

  /**
   * Setup issuer wallet
   * @param {string} issuerId - Issuer ID
   * @param {string} userId - User ID
   * @param {string} companyName - Company name
   * @returns {Promise<object>} Created wallet
   */
  async setupIssuerWallet(issuerId, userId, companyName) {
    try {
      // Create vault account
      const vaultName = `${companyName} Issuer Vault`;
      const vaultData = {
        name: vaultName,
        hiddenOnUI: false,
        customerRefId: `issuer_${issuerId}`,
        autoFuel: false
      };
      
      const vaultAccount = await this.createVaultAccount(vaultData);
      
      if (!vaultAccount || !vaultAccount.id) {
        throw new Error('Failed to create vault account');
      }
      
      console.log('Created vault account:', vaultAccount.id);
      
      // Use ETH_TEST5 for testing
      const assetId = 'ETH_TEST5';
      
      // Create wallet for the asset
      await this.createWallet(vaultAccount.id, assetId);
      
      // Get deposit address
      const addressResponse = await this.getDepositAddress(vaultAccount.id, assetId);
      const depositAddress = addressResponse?.length > 0 ? addressResponse[0].address : null;
      
      // Store wallet in database
      const wallet = await prisma.wallet.create({
        data: {
          type: 'ISSUER',
          chain: 'ethereum',
          address: depositAddress,
          is_active: true,
          is_custodial: true,
          user_id: userId,
          issuer_id: issuerId,
          fireblocks_vault_id: vaultAccount.id,
          fireblocks_vault_account_id: vaultAccount.id,
          fireblocks_asset_id: assetId,
          deposit_address: depositAddress
        }
      });
      
      return wallet;
    } catch (error) {
      console.error('Error in setupIssuerWallet:', error);
      throw new Error(`Failed to setup issuer wallet: ${error.message}`);
    }
  }

  /**
   * Check if issuer wallet setup is completed
   * @param {string} issuerId - Issuer ID
   * @returns {Promise<object>} Setup status
   */
  async isSetupCompleted(issuerId) {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: {
          issuer_id: issuerId,
          type: 'ISSUER'
        }
      });
      
      if (!wallet) {
        return { completed: false, message: 'No wallet found' };
      }
      
      const issuer = await prisma.issuer.findUnique({
        where: { id: issuerId },
        select: { setup_completed: true }
      });
      
      return {
        completed: issuer?.setup_completed || false,
        wallet: {
          id: wallet.id,
          address: wallet.address,
          chain: wallet.chain
        }
      };
    } catch (error) {
      console.error('Error checking setup status:', error);
      return { completed: false, error: error.message };
    }
  }
}

module.exports = new FireblocksService();