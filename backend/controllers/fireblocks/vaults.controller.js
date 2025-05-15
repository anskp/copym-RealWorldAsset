const fireblocksService = require('../../services/fireblocks.service');
const { prisma } = require('../../config/prisma');

// Create a new vault account
exports.createVault = async (req, res) => {
  try {
    const vaultData = req.body;
    const result = await fireblocksService.createVaultAccount(vaultData);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create Fireblocks vault account',
      details: error.response?.data || error.message
    });
  }
};

// Get vault account by ID
exports.getVault = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await fireblocksService.getVaultAccount(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Fireblocks vault account',
      details: error.response?.data || error.message
    });
  }
};

// Create a wallet in a vault
exports.createWallet = async (req, res) => {
  const { vaultId, assetId } = req.params;
  const extraParams = req.body;

  try {
    const result = await fireblocksService.createWallet(vaultId, assetId, extraParams);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in createWallet controller:', error.message);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
};

// Activate a wallet in a vault
exports.activateWallet = async (req, res) => {
  const { vaultId, assetId } = req.params;
  
  try {
    const result = await fireblocksService.activateWallet(vaultId, assetId);
    res.json(result);
  } catch (error) {
    console.error('Error in activateWallet controller:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Rename a vault
exports.renameVault = async (req, res) => {
  const { vaultId } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Vault name is required' });
  }

  try {
    const result = await fireblocksService.renameVaultAccount(vaultId, name);
    res.json(result);
  } catch (error) {
    console.error('Error in renameVault controller:', error.message);
    res.status(500).json({ error: 'Failed to rename vault' });
  }
};

// Get vault asset balance
exports.getVaultAssetBalance = async (req, res) => {
  const { vaultId, assetId } = req.params;
  
  try {
    const result = await fireblocksService.getVaultAssetBalance(vaultId, assetId);
    res.json(result);
  } catch (error) {
    console.error('Error in getVaultAssetBalance controller:', error.message);
    res.status(500).json({ error: 'Failed to fetch vault asset' });
  }
};

// Refresh vault asset balance
exports.refreshVaultAssetBalance = async (req, res) => {
  const { vaultId, assetId } = req.params;

  try {
    const result = await fireblocksService.refreshVaultAssetBalance(vaultId, assetId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in refreshVaultAssetBalance controller:', error.message);
    res.status(500).json({ error: 'Failed to get asset balance' });
  }
};

// Setup issuer wallet
exports.setupIssuerWallet = async (req, res) => {
  try {
    const { issuerId } = req.params;
    const userId = req.user.id;
    
    // Get issuer details
    const issuer = await prisma.issuer.findUnique({
      where: { id: issuerId }
    });
    
    if (!issuer) {
      return res.status(404).json({ error: 'Issuer not found' });
    }
    
    // Create wallet for issuer
    const wallet = await fireblocksService.setupIssuerWallet(
      issuerId, 
      userId, 
      issuer.company_name
    );
    
    // Update issuer setup status
    await prisma.issuer.update({
      where: { id: issuerId },
      data: { 
        setup_completed: true,
        setup_completed_at: new Date()
      }
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Issuer wallet setup completed',
      wallet
    });
  } catch (error) {
    console.error('Error setting up issuer wallet:', error);
    res.status(500).json({ 
      error: 'Failed to setup issuer wallet',
      message: error.message
    });
  }
};

// Check if issuer wallet setup is completed
exports.checkSetupStatus = async (req, res) => {
  try {
    const { issuerId } = req.params;
    
    const status = await fireblocksService.isSetupCompleted(issuerId);
    
    res.status(200).json(status);
  } catch (error) {
    console.error('Error checking setup status:', error);
    res.status(500).json({ 
      error: 'Failed to check setup status',
      message: error.message
    });
  }
};