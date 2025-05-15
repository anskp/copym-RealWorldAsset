const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class FireblocksService {
  constructor() {
    this.apiKey = process.env.FIREBLOCKS_API_KEY;
    this.privateKeyPath = process.env.FIREBLOCKS_API_SECRET_PATH || process.env.FIREBLOCKS_SECRET_PATH;
    this.baseUrl = process.env.FIREBLOCKS_BASE_URL || 'https://sandbox-api.fireblocks.io';
    
    // Fix baseUrl if it has trailing slash
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
    
    this.useMockMode = process.env.USE_MOCK_FIREBLOCKS === 'true';
    
    // Load private key
    try {
      if (this.privateKeyPath) {
        this.privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
        console.log('Fireblocks service initialized with private key');
      } else if (!this.useMockMode) {
        console.warn('FIREBLOCKS_API_SECRET_PATH not set - using mock mode');
        this.useMockMode = true;
      }
    } catch (error) {
      console.error(`Failed to load Fireblocks private key: ${error.message}`);
      console.log('Falling back to mock mode');
      this.useMockMode = true;
      
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
            this.useMockMode = false;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
    }
  }

  // Generate JWT token for authentication
  generateJwt(endpointPath, requestBody = {}) {
    try {
      if (!this.privateKey || !this.apiKey) {
        throw new Error('Missing private key or API key');
      }
      
      const now = Math.floor(Date.now() / 1000);
      const nonce = uuidv4();
      const bodyString = typeof requestBody === 'string' 
        ? requestBody 
        : JSON.stringify(requestBody || {});
      
      const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
      
      const payload = {
        uri: endpointPath,
        nonce,
        iat: now,
        exp: now + 55, // Token expires in 55 seconds
        sub: this.apiKey,
        bodyHash,
      };
      
      const token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        header: {
          typ: 'JWT',
          alg: 'RS256',
        },
      });
      
      return token;
    } catch (error) {
      console.error(`JWT generation failed: ${error.message}`);
      return null;
    }
  }
  
  // Call Fireblocks API with proper error handling and mock fallback
  async callApi(method, endpoint, data = null, mockResponse = {}) {
    if (this.useMockMode) {
      console.log(`MOCK MODE: ${method} ${endpoint}`);
      // Return mock data for development without API access
      return {
        ...mockResponse,
        _mockData: true,
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const bodyData = data || {};
      const token = this.generateJwt(endpoint, bodyData);
      
      if (!token) {
        throw new Error('Failed to generate authentication token');
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await axios({
        method,
        url,
        headers,
        data: method !== 'GET' ? bodyData : undefined
      });
      
      return response.data;
    } catch (error) {
      console.error(`Fireblocks API error (${endpoint}): ${error.message}`);
      
      if (error.response?.status === 401) {
        console.log('Authentication failure. Check API key permissions and private key validity.');
      }
      
      // If configured, fall back to mock mode on error
      if (process.env.FALLBACK_TO_MOCK === 'true') {
        console.log(`Falling back to mock data for ${endpoint}`);
        return {
          ...mockResponse,
          _mockData: true,
          _error: error.message,
          timestamp: new Date().toISOString()
        };
      }
      
      throw error;
    }
  }
  
  // API methods
  
  async createVault(vaultData) {
    const mockVault = {
      id: `mock-vault-${Date.now()}`,
      name: vaultData.name,
      hiddenOnUI: vaultData.hiddenOnUI,
      customerRefId: vaultData.customerRefId,
      autoFuel: vaultData.autoFuel,
      assets: []
    };
    
    return this.callApi('POST', '/v1/vault/accounts', vaultData, mockVault);
  }
  
  async getVault(id) {
    const mockVault = {
      id: id,
      name: `Mock Vault ${id}`,
      hiddenOnUI: false,
      assets: [
        { id: 'BTC_TEST', total: '0.00', available: '0.00', pending: '0.00' },
        { id: 'ETH_TEST', total: '0.00', available: '0.00', pending: '0.00' }
      ]
    };
    
    return this.callApi('GET', `/v1/vault/accounts/${id}`, null, mockVault);
  }
  
  async activateWallet(vaultId, assetId) {
    const mockActivation = {
      activated: true,
      assetId: assetId,
      vaultId: vaultId
    };
    
    return this.callApi('POST', `/v1/vault/accounts/${vaultId}/${assetId}/activate`, {}, mockActivation);
  }
  
  async renameVault(vaultId, newName) {
    const mockRename = {
      id: vaultId,
      name: newName,
      lastUpdated: new Date().toISOString()
    };
    
    return this.callApi('PUT', `/v1/vault/accounts/${vaultId}`, { name: newName }, mockRename);
  }
  
  async getVaultAssetBalance(vaultId, assetId) {
    const mockBalance = {
      id: assetId,
      total: '0.00',
      available: '0.00',
      pending: '0.00',
      lockedAmount: '0.00',
      vaultId: vaultId
    };
    
    return this.callApi('GET', `/v1/vault/accounts/${vaultId}/${assetId}`, null, mockBalance);
  }
  
  async refreshVaultAssetBalance(vaultId, assetType) {
    const mockRefresh = {
      id: assetType,
      total: '0.00',
      available: '0.00',
      pending: '0.00',
      vaultId: vaultId,
      refreshed: true
    };
    
    return this.callApi('POST', `/v1/vault/accounts/${vaultId}/${assetType}/balance`, {}, mockRefresh);
  }
  
  async createWallet(vaultId, assetId, eosAccountName) {
    const mockWallet = {
      id: `mock-wallet-${Date.now()}`,
      vaultId: vaultId,
      assetId: assetId,
      address: `mock-address-${Date.now()}`,
      tag: null
    };
    
    return this.callApi(
      'POST', 
      `/v1/vault/accounts/${vaultId}/${assetId}`, 
      { eosAccountName },
      mockWallet
    );
  }
}

module.exports = new FireblocksService(); 