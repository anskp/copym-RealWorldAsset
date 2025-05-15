const fireblocksService = require('../services/fireblocks-service');

const fireblocksController = {
  // Create a new vault account
  createVault: async (req, res) => {
    try {
      const vaultData = req.body;
      const result = await fireblocksService.createVault(vaultData);
      
      // Check if we got mock data
      if (result._mockData) {
        res.status(200).json({
          ...result,
          message: 'This is mock data. API call was not made to Fireblocks.'
        });
      } else {
        res.status(200).json(result);
      }
    } catch (error) {
      console.error('Error creating vault:', error.message);
      res.status(500).json({
        error: 'Failed to create Fireblocks vault account',
        details: error.response?.data || error.message
      });
    }
  },
  
  // Get a vault by ID
  getVault: async (req, res) => {
    try {
      const id = req.params.id;
      const result = await fireblocksService.getVault(id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error getting vault:', error.message);
      res.status(500).json({
        error: 'Failed to get Fireblocks vault account',
        details: error.response?.data || error.message
      });
    }
  },
  
  // Create a wallet within a vault
  createWallet: async (req, res) => {
    const { vaultId, assetId } = req.params;
    const { eosAccountName } = req.body;
    
    if (!eosAccountName) {
      return res.status(400).json({ error: 'eosAccountName is required' });
    }
    
    try {
      const result = await fireblocksService.createWallet(vaultId, assetId, eosAccountName);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error creating wallet:', error.message);
      res.status(500).json({ 
        error: 'Failed to create wallet',
        details: error.response?.data || error.message
      });
    }
  },
  
  // Activate a wallet in a vault
  activateWallet: async (req, res) => {
    const { vaultId, assetId } = req.params;
    try {
      const result = await fireblocksService.activateWallet(vaultId, assetId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error activating wallet:', error.message);
      res.status(500).json({ 
        error: 'Failed to activate wallet',
        details: error.response?.data || error.message
      });
    }
  },
  
  // Rename a vault account
  renameVault: async (req, res) => {
    const { vaultId } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Vault name is required' });
    }
    
    try {
      const result = await fireblocksService.renameVault(vaultId, name);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error renaming vault:', error.message);
      res.status(500).json({ 
        error: 'Failed to rename vault',
        details: error.response?.data || error.message
      });
    }
  },
  
  // Get asset balance for a vault
  getVaultAssetBalance: async (req, res) => {
    const { vaultId, assetId } = req.params;
    try {
      const result = await fireblocksService.getVaultAssetBalance(vaultId, assetId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error getting asset balance:', error.message);
      res.status(500).json({ 
        error: 'Failed to fetch vault asset',
        details: error.response?.data || error.message
      });
    }
  },
  
  // Refresh asset balance for a vault
  refreshVaultAssetBalance: async (req, res) => {
    const { vaultId, assetType } = req.params;
    try {
      const result = await fireblocksService.refreshVaultAssetBalance(vaultId, assetType);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error refreshing asset balance:', error.message);
      res.status(500).json({ 
        error: 'Failed to refresh asset balance',
        details: error.response?.data || error.message
      });
    }
  }
};

module.exports = fireblocksController; 