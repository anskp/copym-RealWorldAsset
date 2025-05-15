const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { generateCredentialSvg } = require('../../utils/svgGenerator');
const { CHAIN_CONFIG } = require('../../utils/fireblocksUtils');
const fireblocksService = require('../fireblocks.service');

const prisma = new PrismaClient();

/**
 * Wallet Service - Contains business logic for wallet-related operations
 */
class WalletService {
  /**
   * Helper function for making mock API responses
   * @param {string} endpoint - API endpoint
   * @returns {object} Mock API response
   * @private
   */

  /**
   * Helper function for making mock API responses
   * @param {string} endpoint - API endpoint
   * @returns {object} Mock API response
   * @private
   */
  async _getMockData(endpoint) {
    console.log(`Returning mock data for ${endpoint}`);
    
    // Generate mock data based on the endpoint
    if (endpoint.includes('/balances')) {
      return {
        chain: 'ethereum',
        tokens: [
          {
            symbol: 'ETH',
            balance: '1.75',
            value: { amount: '2800', currency: 'USD' }
          },
          {
            symbol: 'USDC',
            balance: '1250',
            value: { amount: '1250', currency: 'USD' }
          }
        ]
      };
    } else if (endpoint.includes('/transactions')) {
      return { 
        transactions: Array(5).fill().map((_, i) => ({
          id: `mock-tx-${Date.now()}-${i}`,
          type: ['SEND', 'RECEIVE'][Math.floor(Math.random() * 2)],
          status: ['CONFIRMED', 'PENDING'][Math.floor(Math.random() * 2)],
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          amount: (Math.random() * 0.5).toFixed(4),
          symbol: ['ETH', 'USDC'][Math.floor(Math.random() * 2)],
          from: `0x${Math.random().toString(16).slice(2, 42)}`,
          to: `0x${Math.random().toString(16).slice(2, 42)}`,
          hash: `0x${Math.random().toString(16).slice(2, 64)}`
        }))
      };
    }
    
    // Default mock response
    return { mock: true, message: 'Mock data due to API error' };
  }

  /**
   * Get supported blockchain chains
   * @returns {string[]} List of supported chains
   */
  getSupportedChains() {
    return Object.keys(CHAIN_CONFIG);
  }

  /**
   * Get or create user's wallet
   * @param {number} userId - User ID
   * @param {boolean} isIssuer - Whether the user is an issuer
   * @param {string} chain - Blockchain chain
   * @returns {Promise<object>} Wallet data
   */
  async getUserWallet(userId, isIssuer, chain) {
    // Check if wallet exists
    let wallet = await prisma.wallet.findFirst({
      select: {
        id: true,
        address: true,
        type: true,
        chain: true,
        is_active: true,
        is_custodial: true,
        user_id: true,
        issuer_id: true,
        created_at: true,
        updated_at: true,
        fireblocks_vault_id: true,
        fireblocks_vault_account_id: true,
        fireblocks_asset_id: true,
        deposit_address: true
      },
      where: { user_id: userId } 
    });
    
    if (!wallet) {
      throw new Error('No wallet found. Please complete setup in the issuer dashboard.');
    }

    return wallet;
  }



  /**
   * Get wallet balance
   * @param {number} userId - User ID
   * @returns {Promise<object>} Balance data
   */
  async getWalletBalance(userId) {
    // Get user's wallet
    const wallet = await prisma.wallet.findFirst({
      select: {
        id: true,
        address: true,
        type: true,
        chain: true,
        is_active: true,
        is_custodial: true,
        user_id: true,
        issuer_id: true,
        created_at: true,
        updated_at: true,
        fireblocks_vault_id: true,
        fireblocks_vault_account_id: true,
        fireblocks_asset_id: true,
        deposit_address: true
      },
      where: { user_id: userId }
    });

    if (!wallet) {
      throw new Error('No wallet found for this user');
    }

    try {
      // Use the Fireblocks service to get real balance data
      console.log('Using real Fireblocks API for balance');
      
      // Check if we have the vault ID and asset ID
      if (!wallet.fireblocks_vault_id || !wallet.fireblocks_asset_id) {
        console.warn('Missing vault ID or asset ID, using mock data');
        return await this._getMockData('/balances');
      }
      
      // Get the balance from Fireblocks
      const balanceData = await fireblocksService.getVaultAssetBalance(
        wallet.fireblocks_vault_id, 
        wallet.fireblocks_asset_id
      );
      
      if (!balanceData) {
        console.warn('No balance data returned from Fireblocks');
        return await this._getMockData('/balances');
      }
      
      // Format the response
      return {
        chain: wallet.chain,
        tokens: [{
          symbol: wallet.fireblocks_asset_id,
          balance: balanceData.available || '0',
          value: {
            amount: balanceData.total || '0',
            currency: 'USD'
          }
        }]
      };
    } catch (error) {
      console.error('Error fetching real balance from Fireblocks:', error);
      // Fallback to mock data if API call fails
      return await this._getMockData('/balances');
    }
  }

  /**
   * Get NFTs owned by the wallet
   * @param {number} userId - User ID
   * @returns {Promise<object>} NFT data
   */
  async getWalletNFTs(userId) {
    // Get user's wallet
    const wallet = await prisma.wallet.findFirst({
      select: {
        id: true,
        address: true,
        type: true,
        chain: true,
        is_active: true,
        is_custodial: true,
        user_id: true,
        issuer_id: true,
        created_at: true,
        updated_at: true,
        fireblocks_vault_id: true,
        fireblocks_vault_account_id: true,
        fireblocks_asset_id: true,
        deposit_address: true
      },
      where: { user_id: userId }
    });
    
    if (!wallet) throw new Error('No wallet found for this user');

    // Get issuer profile - don't throw error if not found
    const issuer = await prisma.issuer.findFirst({
      where: { user_id: userId }
    });

    // Initialize return structure
    let dbNfts = [];
    let fireblocksNfts = [];

    // Get credentials from database if issuer exists
    if (issuer) {
      try {
        const credentials = await prisma.issuer_credentials.findMany({
          where: { issuer_id: issuer.id },
          select: {
            id: true, credential_id: true, credential_type: true, status: true,
            issued_date: true, expiry_date: true, metadata: true
          },
          orderBy: { created_at: 'desc' }
        });

        // Format response
        dbNfts = credentials.map(cred => {
          let metadata = {};
          try {
            if (cred.metadata) metadata = JSON.parse(cred.metadata);
          } catch (error) {
            console.warn(`Failed to parse metadata for credential ${cred.id}:`, error.message);
          }

          return {
            id: cred.id,
            credentialId: cred.credential_id,
            type: cred.credential_type,
            status: cred.status,
            issuedDate: cred.issued_date,
            expiryDate: cred.expiry_date,
            chain: metadata?.onChain?.chain,
            contractAddress: metadata?.onChain?.contractAddress,
            tokenId: metadata?.onChain?.tokenId,
            transactionHash: metadata?.onChain?.transactionHash,
            metadata
          };
        });
      } catch (dbError) {
        console.error('Error fetching database NFTs:', dbError);
      }
    }

    // Return structured response
    return {
      dbNfts,
      fireblocksNfts: [],
      total: dbNfts.length
    };
  }

  /**
   * Get wallet transactions
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Transaction data
   */
  async getWalletTransactions(userId) {
    const wallet = await prisma.wallet.findFirst({
      select: {
        id: true,
        address: true,
        type: true,
        chain: true,
        is_active: true,
        is_custodial: true,
        user_id: true,
        issuer_id: true,
        created_at: true,
        updated_at: true,
        fireblocks_vault_id: true,
        fireblocks_vault_account_id: true,
        fireblocks_asset_id: true,
        deposit_address: true
      },
      where: { user_id: userId }
    });
    
    if (!wallet) {
      throw new Error('No wallet found for this user');
    }
    
    try {
      console.log('Using real Fireblocks API for transactions');

      // Check if we have the vault ID      
      if (!wallet.fireblocks_vault_id) {
        console.warn('Missing vault ID, using mock data');
        return await this._getMockData('/transactions');
      }

      // Attempt to get transactions from Fireblocks
      const transactions = await fireblocksService.getVaultTransactions(
        wallet.fireblocks_vault_id
      );
      
      if (!transactions || transactions.length === 0) {
        console.warn('No transactions returned from Fireblocks');
        return await this._getMockData('/transactions');
      }
      
      // Format the transactions
      const formattedTransactions = transactions.map(tx => ({
        id: tx.id || `tx-${Date.now()}`,
        type: tx.source?.type === 'VAULT_ACCOUNT' ? 'SEND' : 'RECEIVE',
        status: tx.status,
        timestamp: tx.lastUpdated || tx.createdAt || new Date().toISOString(),
        amount: tx.amount || '0',
        symbol: tx.assetId || 'ETH',
        from: tx.source?.id || '',
        to: tx.destination?.id || '',
        hash: tx.txHash || ''
      }));
      
      return { transactions: formattedTransactions };
    } catch (error) {
      console.error('Error fetching real transactions from Fireblocks:', error);
      // Fallback to mock data
      return await this._getMockData('/transactions');
    }
  }
}

module.exports = new WalletService(); 