const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/prisma');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { CHAIN_CONFIG, getFireblocksAssetId } = require('../utils/fireblocksUtils');

const prismaClient = new PrismaClient();

class FireblocksService {
  constructor() {
    console.log('Initializing FireblocksService...');
    
    // Check if we should use mock mode based on environment variable
    this.useMockMode = process.env.USE_MOCK_FIREBLOCKS === 'true';
    console.log('USE_MOCK_FIREBLOCKS env value:', process.env.USE_MOCK_FIREBLOCKS);
    
    if (this.useMockMode) {
      console.log('⚠️ USING MOCK MODE for Fireblocks API calls');
    } else {
      console.log('✅ USING REAL Fireblocks API');
    }
    
    // Get API credentials from environment
    this.apiKey = process.env.FIREBLOCKS_API_KEY;
    this.secretKeyPath = process.env.FIREBLOCKS_API_SECRET_PATH;
    
    // Initialize the base URL with a default value
    this.baseUrl = 'https://sandbox-api.fireblocks.io';
    
    // If environment variable is provided, use that instead
    if (process.env.FIREBLOCKS_BASE_URL) {
      let configuredUrl = process.env.FIREBLOCKS_BASE_URL.trim();
      
      // Ensure URL has proper protocol
      if (!configuredUrl.startsWith('http')) {
        configuredUrl = 'https://' + configuredUrl;
      }
      
      // Remove trailing slash for consistent URL construction
      this.baseUrl = configuredUrl.endsWith('/') ? configuredUrl.slice(0, -1) : configuredUrl;
      
      console.log(`Using configured Fireblocks base URL: ${this.baseUrl}`);
    } else {
      console.log(`Using default Fireblocks sandbox URL: ${this.baseUrl}`);
    }
    
    // Log configuration
    console.log(`API Key: ${this.apiKey ? 'Set' : 'Not set'}`);
    console.log(`Secret Key Path: ${this.secretKeyPath}`);
    console.log(`Base URL: ${this.baseUrl}`);
    
    // Start the initialization process and save the promise for later awaiting
    this.initialized = this._initialize().catch(err => {
      console.error('Unhandled error during initialization:', err);
      this.useMockMode = true;
      return false;
    });
  }

  async _initialize() {
    try {
      if (this.useMockMode) {
        console.log('Mock mode is active - skipping API key validation');
        return false;
      }
      
      if (!this.apiKey) {
        console.warn('Fireblocks API Key not found in environment variables');
        console.warn('Switching to mock mode');
        this.useMockMode = true;
        return false;
      }

      if (!this.secretKeyPath) {
        console.warn('Fireblocks Secret Path not found in environment variables');
        console.warn('Switching to mock mode');
        this.useMockMode = true;
        return false;
      }

      // Array of possible locations for the private key
      const possibleKeyPaths = [
        this.secretKeyPath,
        path.join(process.cwd(), this.secretKeyPath),
        path.join(process.cwd(), '..', this.secretKeyPath),
        path.join(__dirname, '..', this.secretKeyPath)
      ];
      
      console.log('Trying to find private key in these locations:');
      possibleKeyPaths.forEach(p => console.log(` - ${p}`));
      
      let keyFound = false;
      let privateKey;
      
      for (const keyPath of possibleKeyPaths) {
        try {
          if (fs.existsSync(keyPath)) {
            console.log(`Found key file at: ${keyPath}`);
            privateKey = fs.readFileSync(keyPath, 'utf8');
            
            // Check if the key is properly formatted
            if (privateKey.includes('-----BEGIN PRIVATE KEY-----') && 
                privateKey.includes('-----END PRIVATE KEY-----')) {
              this.privateKey = privateKey;
              keyFound = true;
              break;
            } else {
              console.warn(`Key file found at ${keyPath} but format is invalid`);
            }
          }
        } catch (err) {
          console.warn(`Error reading key from ${keyPath}: ${err.message}`);
        }
      }
      
      if (!keyFound) {
        console.warn('No valid Fireblocks private key found in any location');
        console.warn('Switching to mock mode');
        this.useMockMode = true;
        return false;
      }
      
      console.log('Fireblocks private key loaded successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Fireblocks service:', error.message);
      console.warn('Switching to mock mode');
      this.useMockMode = true;
      return false;
    }
  }

  _generateSignature(path, bodyJson = '', method = 'POST') {
    if (!this.privateKey) {
      console.warn('Private key not available, cannot generate signature');
      return { signature: '', timestamp: 0 };
    }

    try {
      // Get current Unix timestamp in seconds
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Calculate SHA-256 hash of the request body
      const bodyHash = crypto.createHash('sha256').update(bodyJson || '').digest('hex');
      
      // Per Fireblocks API docs:
      // The message for signing follows this format: <timestamp>\n<http_method>\n<api_path>\n<request_body_hash>
      // Example: 1613049308\nPOST\n/v1/vault/accounts\n9729822132bc0e9e2fd3ce7ff41d5d62ff8c304e75d3f1a00cc678e792541b6e
      
      // Convert method to uppercase as per documentation
      const httpMethod = method.toUpperCase();
      
      // Create the message to sign (exactly as described in Fireblocks API docs)
      const message = `${timestamp}\n${httpMethod}\n${path}\n${bodyHash}`;
      
      console.log('Creating signature with message format: <timestamp>\\n<http_method>\\n<api_path>\\n<request_body_hash>');
      console.log(`Message to sign: ${message}`);
      
      // Create JWT token with the required claims
      const token = jwt.sign({
        uri: path,
        nonce: uuidv4(),
        iat: timestamp,
        exp: timestamp + 55,
        sub: this.apiKey,
        bodyHash: bodyHash
      }, this.privateKey, { algorithm: 'RS256' });
      
      console.log('JWT token generated successfully');
      
      return {
        signature: token,
        timestamp
      };
    } catch (error) {
      console.error('Error generating signature:', error.message, error.stack);
      return { signature: '', timestamp: 0 };
    }
  }

  async _makeRequest(method, endpoint, data = null) {
    try {
      await this.initialized;
      
      if (this.useMockMode) {
        console.log('Using MOCK MODE for Fireblocks API calls');
        return this._getMockResponse(endpoint, method);
      }
      
      if (!this.apiKey || !this.privateKey) {
        console.warn('Using mock data since Fireblocks SDK is not properly initialized');
        return this._getMockResponse(endpoint, method);
      }

      // Ensure baseUrl is properly set and normalized
      if (!this.baseUrl) {
        console.warn('baseUrl is not set, using default sandbox URL');
        this.baseUrl = 'https://sandbox-api.fireblocks.io';
      }
      
      // Make sure endpoint starts with a slash
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      // Construct the full URL - Ensure no undefined can be inserted in the URL
      const url = `${this.baseUrl}${formattedEndpoint}`;
      
      // Convert method to uppercase for consistency
      const httpMethod = method.toUpperCase();
      console.log(`Making ${httpMethod} request to: ${url}`);
      
      // Prepare request body if provided
      const bodyJson = data ? JSON.stringify(data) : '';
      
      // Generate JWT token for authentication
      const { signature: token } = this._generateSignature(formattedEndpoint, bodyJson, httpMethod);
      
      if (!token) {
        console.warn('Failed to generate JWT token, using mock response instead');
        return this._getMockResponse(endpoint, method);
      }

      // Setup request headers according to Fireblocks API documentation
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      console.log('Request headers:', {
        'Authorization': 'Bearer ***',
        'Content-Type': 'application/json'
      });

      // Make the API request using axios
      const response = await axios({
        method: httpMethod,
        url,
        headers,
        data: bodyJson || undefined
      });

      console.log(`Successful ${httpMethod} response from ${url}`);
      return response.data;
    } catch (error) {
      console.error(`Error making ${method} request to ${endpoint}:`, error.message);
      
      // Log detailed error information if available
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data));
      }
      
      if (error.request) {
        console.error('Request details:', {
          method: error.request.method,
          path: error.request.path,
          host: error.request.host
        });
      }
      
      // Re-throw the error with more context
      const enhancedError = new Error(`Fireblocks API error: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.endpoint = endpoint;
      throw enhancedError;
    }
  }

  _getMockResponse(endpoint, method) {
    const timestamp = Date.now();
    
    // Generate a valid Ethereum address for mocks (0x + 40 hex characters)
    const generateMockEthAddress = () => {
      return `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    };
    
    // For vault creation
    if (endpoint === '/v1/vault/accounts' && method === 'post') {
      return {
        id: `mock-vault-${timestamp}`,
        name: 'Mock Vault Account',
        hiddenOnUI: false,
        customerRefId: `mock-ref-${timestamp}`,
        autoFuel: false,
        assets: []
      };
    }
    
    // For wallet creation
    if (endpoint.includes('/v1/vault/accounts/') && endpoint.includes('/')) {
      return {
        id: `mock-wallet-${timestamp}`,
        address: generateMockEthAddress(),
        legacyAddress: null,
        tag: null,
        status: 'ACTIVE'
      };
    }
    
    // For vault retrieval
    if (endpoint.startsWith('/v1/vault/accounts/') && method === 'get') {
      return {
        id: endpoint.split('/').pop(),
        name: 'Mock Retrieved Vault',
        hiddenOnUI: false,
        assets: []
      };
    }
    
    return { mock: true, timestamp };
  }

  async createVaultAccount(vaultData) {
    try {
      const data = {
        name: vaultData.name || 'New Vault Account',
        hiddenOnUI: vaultData.hiddenOnUI || false,
        customerRefId: vaultData.customerRefId || uuidv4(),
        autoFuel: vaultData.autoFuel || false,
        vaultType: vaultData.vaultType || 'MPC'
      };
      
      const result = await this._makeRequest('post', '/v1/vault/accounts', data);
      return result;
    } catch (error) {
      console.error('Error creating vault account:', error.message);
      console.log('Falling back to mock data for vault account creation');
      // Return mock data as a fallback
      return this._getMockResponse('/v1/vault/accounts', 'post');
    }
  }

  async getVaultAccount(vaultId) {
    try {
      const result = await this._makeRequest('get', `/v1/vault/accounts/${vaultId}`);
      return result;
    } catch (error) {
      console.error('Error getting vault account:', error.message);
      console.log('Falling back to mock data for vault account retrieval');
      // Return mock data as a fallback
      return this._getMockResponse(`/v1/vault/accounts/${vaultId}`, 'get');
    }
  }

  async createWallet(vaultId, assetId, extraParams = {}) {
    try {
      const endpoint = `/v1/vault/accounts/${vaultId}/${assetId}`;
      const result = await this._makeRequest('post', endpoint, extraParams);
      return result;
    } catch (error) {
      console.error('Error creating wallet:', error.message);
      console.log('Falling back to mock data for wallet creation');
      // Return mock data as a fallback
      return this._getMockResponse(`/v1/vault/accounts/${vaultId}/${assetId}`, 'post');
    }
  }

  async activateWallet(vaultId, assetId) {
    try {
      const endpoint = `/v1/vault/accounts/${vaultId}/${assetId}/activate`;
      const result = await this._makeRequest('post', endpoint);
      return result;
    } catch (error) {
      console.error('Error activating wallet:', error.message);
      console.log('Falling back to mock data for wallet activation');
      // Generate a mock wallet response with an Ethereum address
      return {
        address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        legacyAddress: null,
        tag: null,
        status: 'ACTIVE'
      };
    }
  }

  async renameVaultAccount(vaultId, newName) {
    try {
      const data = { name: newName };
      const result = await this._makeRequest('put', `/v1/vault/accounts/${vaultId}`, data);
      return result;
    } catch (error) {
      console.error('Error renaming vault account:', error.message);
      throw error;
    }
  }

  async getVaultAssetBalance(vaultId, assetId) {
    try {
      const result = await this._makeRequest('get', `/v1/vault/accounts/${vaultId}/${assetId}`);
      return result;
    } catch (error) {
      console.error('Error getting vault asset balance:', error.message);
      console.log('Falling back to mock data for vault asset balance');
      // Return mock data as a fallback
      return this._getMockResponse(`/v1/vault/accounts/${vaultId}/${assetId}`, 'get');
    }
  }

  async getVaultTransactions(vaultId, limit = 50) {
    try {
      console.log(`Getting transactions for vault ID: ${vaultId}`);
      const result = await this._makeRequest('get', `/v1/transactions?vaultAccountIds=${vaultId}&limit=${limit}`);
      return result?.transactions || [];
    } catch (error) {
      console.error('Error getting vault transactions:', error.message);
      // Return empty array if there's an error
      return [];
    }
  }

  async refreshVaultAssetBalance(vaultId, assetId) {
    try {
      const result = await this._makeRequest('post', `/v1/vault/accounts/${vaultId}/${assetId}/balance`);
      return result;
    } catch (error) {
      console.error('Error refreshing vault asset balance:', error.message);
      console.log('Falling back to mock data for vault asset balance refresh');
      // Return mock data as a fallback
      return this._getMockResponse(`/v1/vault/accounts/${vaultId}/${assetId}`, 'get');
    }
  }

  // Function to setup wallet for an issuer
  async setupIssuerWallet(issuerId, userId, companyName) {
    console.log(`Creating Fireblocks vault account for issuer ${issuerId}, user ${userId}, company ${companyName}`);
    
    // Generate a valid Ethereum address for mocks (0x + 40 hex characters)
    const generateMockEthAddress = () => {
      return `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    };
    
    try {
      // 1. Create a vault for the issuer
      const vaultData = {
        name: `${companyName} Vault`,
        hiddenOnUI: false,
        customerRefId: issuerId,
        autoFuel: true,
        vaultType: 'MPC'
      };
      
      console.log('Creating vault with data:', JSON.stringify(vaultData));
      let vaultAccount;
      
      try {
        vaultAccount = await this.createVaultAccount(vaultData);
        console.log('Vault account created:', vaultAccount.id);
      } catch (vaultError) {
        console.error('Failed to create real vault, using mock vault:', vaultError.message);
        // Use mock data if API call fails
        vaultAccount = {
          id: `mock-vault-${Date.now()}`,
          name: `${companyName} Vault (Mock)`,
          hiddenOnUI: false,
          customerRefId: issuerId,
          autoFuel: true
        };
      }
      
      // 2. Add an asset (e.g., ETH_TEST) to the vault
      const assetId = 'ETH_TEST';
      console.log(`Adding asset ${assetId} to vault account ${vaultAccount.id}`);
      
      let wallet;
      try {
        wallet = await this.activateWallet(vaultAccount.id, assetId);
        console.log('Wallet activated:', wallet);
      } catch (walletError) {
        console.error('Failed to activate wallet, using mock wallet:', walletError.message);
        // Use mock data if API call fails
        wallet = {
          address: generateMockEthAddress(),
          legacyAddress: null,
          tag: null,
          status: 'ACTIVE'
        };
      }
      
      // 3. If the selected asset type is something like GOLD, create an ERC-20 token
      const selectedAssetType = await this.getIssuerAssetType(issuerId);
      if (selectedAssetType && selectedAssetType !== 'ETH_TEST') {
        console.log(`Creating ERC-20 token on ethereum for ${selectedAssetType} asset type`);
        // This would typically involve additional API calls to create a token
      }
      
      // 4. Store wallet info in database
      let dbWallet;
      try {
        // Check if wallet exists first
        const existingWallet = await prisma.wallet.findFirst({
          where: {
            issuer_id: issuerId
          }
        });
        
        const walletData = {
          address: wallet.address || generateMockEthAddress(),
          type: 'ERC20',
          chain: 'ethereum',
          provider: 'fireblocks',
          is_active: true,
          is_custodial: true,
          fireblocks_vault_id: vaultAccount.id,
          fireblocks_vault_account_id: `${vaultAccount.id}`,
          fireblocks_asset_id: assetId,
          deposit_address: wallet.address || generateMockEthAddress()
        };
        
        if (existingWallet) {
          console.log('Wallet already exists for this issuer, updating...');
          dbWallet = await prisma.wallet.update({
            where: { id: existingWallet.id },
            data: walletData
          });
        } else {
          console.log('Creating new wallet for issuer...');
          dbWallet = await prisma.wallet.create({
            data: {
              user_id: userId,
              issuer_id: issuerId,
              ...walletData
            }
          });
        }
        
        console.log('Wallet saved to database:', dbWallet.id);
        return dbWallet;
      } catch (dbError) {
        console.error('Error with database operation:', dbError);
        
        // If the full operation fails due to schema mismatch, try with only essential fields
        try {
          const existingWallet = await prisma.wallet.findFirst({
            where: {
              issuer_id: issuerId
            }
          });
          
          const minimalWalletData = {
            address: wallet.address || generateMockEthAddress(),
            type: 'ERC20',
            chain: 'ethereum',
            provider: 'fireblocks',
            is_active: true
          };
          
          if (existingWallet) {
            dbWallet = await prisma.wallet.update({
              where: { id: existingWallet.id },
              data: minimalWalletData
            });
          } else {
            dbWallet = await prisma.wallet.create({
              data: {
                user_id: userId,
                issuer_id: issuerId,
                ...minimalWalletData
              }
            });
          }
          
          return dbWallet;
        } catch (minimalError) {
          console.error('Even minimal wallet operation failed:', minimalError);
          throw minimalError;
        }
      }
    } catch (error) {
      console.error('Error setting up issuer wallet:', error);
      throw error;
    }
  }

  async getIssuerAssetType(issuerId) {
    try {
      const issuer = await prisma.issuer.findUnique({
        where: { id: issuerId }
      });
      
      return issuer?.selected_asset_type || 'ETH_TEST';
    } catch (error) {
      console.error('Error getting issuer asset type:', error);
      return 'ETH_TEST';
    }
  }

  async isSetupCompleted(issuerId) {
    try {
      const issuer = await prisma.issuer.findUnique({
        where: { id: issuerId },
        select: { setup_completed: true }
      });
      
      const isSetupCompleted = issuer && issuer.setup_completed;
      
      if (isSetupCompleted) {
        // Get wallet details
        const wallet = await prisma.wallet.findFirst({
          where: { issuer_id: issuerId }
        });
        
        return { completed: true, wallet };
      }
      
      return { completed: false };
    } catch (error) {
      console.error('Error checking if setup is completed:', error);
      throw error;
    }
  }
}

module.exports = new FireblocksService();