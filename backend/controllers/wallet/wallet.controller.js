const walletService = require('../../services/wallet/wallet.service');
const { PrismaClient } = require('@prisma/client');

// Create the Prisma client
const prisma = new PrismaClient();

// Use environment variable instead of hardcoded value
const USE_MOCK_MODE = process.env.USE_MOCK_FIREBLOCKS === 'true';

// Generate a valid Ethereum address for mocks (0x + 40 hex characters)
const generateMockEthAddress = () => {
  return `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
};

/**
 * Wallet Controller - Handles wallet-related HTTP requests
 */
class WalletController {
  /**
   * Get wallet data for authenticated user
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async getWallet(req, res) {
    try {
      const userId = req.user.id;
      
      // Check if user has an issuer profile
      const issuer = await prisma.issuer.findFirst({
        where: { user_id: userId }
      });
      
      const isIssuer = !!issuer;
      console.log(`User ${userId} isIssuer: ${isIssuer}`);
      
      // DEVELOPMENT MOCK WALLET: If in mock mode, create a mock wallet instead of calling the service
      if (USE_MOCK_MODE) {
        console.log('Using MOCK MODE for wallet creation');
        
        // Create or get wallet from database directly
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
          // Create a mock wallet record
          wallet = await prisma.wallet.create({
            data: {
              user_id: userId,
              issuer_id: isIssuer ? issuer.id : null,
              address: generateMockEthAddress(),
              type: 'custodial',
              chain: 'ethereum',
              is_active: true,
              is_custodial: true,
              created_at: new Date(),
              updated_at: new Date(),
              provider: 'mock',
              fireblocks_vault_id: `mock-vault-${Date.now()}`,
              fireblocks_vault_account_id: `mock-account-${Date.now()}`,
              fireblocks_asset_id: 'ETH_TEST',
              deposit_address: generateMockEthAddress()
            }
          });
        }
        
        return res.json({
          wallet,
          balance: {
            chain: wallet.chain,
            tokens: [
              {
                symbol: 'ETH',
                balance: '1.5',
                value: {
                  amount: '2500',
                  currency: 'USD'
                }
              },
              {
                symbol: 'USDC',
                balance: '1000',
                value: {
                  amount: '1000',
                  currency: 'USD'
                }
              }
            ]
          }
        });
      }
      
      // If not using mock mode, call the wallet service as usual
      const wallet = await walletService.getUserWallet(userId, isIssuer);
      
      // Get wallet balance
      const balance = await walletService.getWalletBalance(userId);
      
      // Return wallet data
      res.json({
        wallet,
        balance
      });
    } catch (error) {
      console.error('Error in wallet route:', error);
      res.status(500).json({
        message: 'Error in wallet route',
        error: error.message
      });
    }
  }

  /**
   * Create a new wallet for a specific chain
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async createWallet(req, res) {
    try {
      const { chain } = req.body;
      if (!chain) {
        return res.status(400).json({
          error: 'Chain parameter is required',
          supportedChains: walletService.getSupportedChains()
        });
      }
      
      const isIssuer = req.user.userrole.some(role => role.role === 'ISSUER');
      const result = await walletService.createWallet(req.user.id, isIssuer, chain);
      
      res.json({
        success: true,
        wallet: result.wallet,
        chain: result.chain,
        did: result.did
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      res.status(500).json({ 
        message: 'Error creating wallet', 
        error: error.message 
      });
    }
  }

  /**
   * Get wallet balance
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async getWalletBalance(req, res) {
    try {
      const balance = await walletService.getWalletBalance(req.user.id);
      res.json(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      const statusCode = error.message === 'No wallet found for this user' ? 404 : 500;
      res.status(statusCode).json({ 
        message: error.message || 'Failed to fetch wallet balance',
        error: error.message 
      });
    }
  }

  /**
   * Get NFTs owned by the wallet
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async getWalletNFTs(req, res) {
    try {
      const nfts = await walletService.getWalletNFTs(req.user.id);
      res.json(nfts);
    } catch (error) {
      console.error('Error fetching wallet NFTs:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ 
        message: error.message || 'Failed to fetch wallet NFTs',
        error: error.message 
      });
    }
  }

  /**
   * Get wallet transactions
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async getWalletTransactions(req, res) {
    try {
      const transactions = await walletService.getWalletTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      const statusCode = error.message === 'No wallet found for this user' ? 404 : 500;
      res.status(statusCode).json({ 
        message: error.message || 'Failed to fetch wallet transactions',
        error: error.message 
      });
    }
  }
}

module.exports = new WalletController(); 