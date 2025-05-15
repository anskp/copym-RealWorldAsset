const { prisma } = require('../../config/prisma');
const fireblocksService = require('../../services/fireblocks.service');
const fireblocksVaultService = require('../../services/fireblocks-vault-service');

/**
 * Get setup options for issuer
 */
exports.getSetupOptions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get issuer for the user
    const issuer = await prisma.issuer.findFirst({
      where: { user_id: userId }
    });
    
    if (!issuer) {
      return res.status(404).json({ error: 'Issuer not found' });
    }
    
    // Check if setup is already completed
    const isSetupCompleted = await fireblocksService.isSetupCompleted(issuer.id);
    
    // Return available setup options and status
    res.status(200).json({
      issuer_id: issuer.id,
      setup_completed: isSetupCompleted.completed,
      wallet: isSetupCompleted.wallet || null,
      asset_types: ['ETH_TEST', 'GOLD', 'SILVER', 'EQUITY', 'REAL_ESTATE'],
      blockchains: ['ethereum', 'polygon', 'avalanche'],
      token_standards: ['ERC-20', 'ERC-721', 'ERC-1155']
    });
  } catch (error) {
    console.error('Error checking issuer setup status:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update issuer preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selected_asset_type, selected_blockchain, selected_token_standard } = req.body;
    
    // Get issuer for the user
    const issuer = await prisma.issuer.findFirst({
      where: { user_id: userId }
    });
    
    if (!issuer) {
      return res.status(404).json({ error: 'Issuer not found' });
    }
    
    // Update issuer preferences
    const updatedIssuer = await prisma.issuer.update({
      where: { id: issuer.id },
      data: {
        selected_asset_type,
        selected_blockchain,
        selected_token_standard
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        selected_asset_type: updatedIssuer.selected_asset_type,
        selected_blockchain: updatedIssuer.selected_blockchain,
        selected_token_standard: updatedIssuer.selected_token_standard
      }
    });
  } catch (error) {
    console.error('Error updating issuer preferences:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Complete issuer setup by creating vault and wallet
 */
exports.completeSetup = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get preferences from request body
    const { selected_asset_type, selected_blockchain, selected_token_standard } = req.body;
    
    // Get issuer for the user
    const issuer = await prisma.issuer.findFirst({
      where: { user_id: userId }
    });
    
    if (!issuer) {
      return res.status(404).json({ error: 'Issuer not found' });
    }
    
    // Update issuer preferences if provided in the request
    if (selected_asset_type || selected_blockchain || selected_token_standard) {
      await prisma.issuer.update({
        where: { id: issuer.id },
        data: {
          selected_asset_type: selected_asset_type || issuer.selected_asset_type,
          selected_blockchain: selected_blockchain || issuer.selected_blockchain,
          selected_token_standard: selected_token_standard || issuer.selected_token_standard
        }
      });
    }
    
    // Get updated issuer data with selected preferences
    const updatedIssuer = await prisma.issuer.findUnique({
      where: { id: issuer.id },
      select: {
        id: true,
        company_name: true,
        selected_asset_type: true,
        selected_blockchain: true,
        selected_token_standard: true
      }
    });
    
    // Check if all required preferences are selected
    if (!updatedIssuer.selected_asset_type || !updatedIssuer.selected_blockchain || !updatedIssuer.selected_token_standard) {
      return res.status(400).json({ 
        error: 'Please select all required preferences before completing setup',
        missing_fields: {
          asset_type: !updatedIssuer.selected_asset_type,
          blockchain: !updatedIssuer.selected_blockchain,
          token_standard: !updatedIssuer.selected_token_standard
        }
      });
    }
    
    // Check if setup is already completed
    const isSetupCompleted = await fireblocksService.isSetupCompleted(issuer.id);
    
    if (isSetupCompleted.completed) {
      return res.status(200).json({
        success: true,
        message: 'Setup already completed',
        wallet: isSetupCompleted.wallet
      });
    }
    
    // Create vault using our new service with the selected options
    const vaultResult = await fireblocksVaultService.createIssuerVault({
      issuerId: updatedIssuer.id,
      companyName: updatedIssuer.company_name,
      assetType: updatedIssuer.selected_asset_type,
      blockchain: updatedIssuer.selected_blockchain,
      tokenStandard: updatedIssuer.selected_token_standard
    });
    
    // Create wallet record in database
    const wallet = await prisma.wallet.create({
      data: {
        user_id: userId,
        issuer_id: updatedIssuer.id,
        address: vaultResult.wallet.depositAddress || vaultResult.wallet.vaultId.toString(), 
        chain: vaultResult.wallet.blockchain,
        type: 'evm-mpc-wallet',
        provider: 'fireblocks',
        is_active: true,
        is_custodial: true,
        fireblocks_vault_id: vaultResult.vault.id.toString(),
        fireblocks_asset_id: vaultResult.wallet.assetId,
        external_id: vaultResult.vault.id.toString(),
        deposit_address: vaultResult.wallet.depositAddress
      }
    });
    
    // Update issuer setup status
    await prisma.issuer.update({
      where: { id: updatedIssuer.id },
      data: {
        setup_completed: true,
        setup_completed_at: new Date()
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Setup completed successfully',
      vault: vaultResult.vault,
      wallet: wallet
    });
  } catch (error) {
    console.error('Error completing issuer setup:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Check setup status
 */
exports.checkStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get issuer for the user
    const issuer = await prisma.issuer.findFirst({
      where: { user_id: userId }
    });
    
    if (!issuer) {
      return res.status(404).json({ error: 'Issuer not found' });
    }
    
    // Check if setup is completed
    const status = await fireblocksService.isSetupCompleted(issuer.id);
    
    res.status(200).json(status);
  } catch (error) {
    console.error('Error checking setup status:', error);
    res.status(500).json({ error: error.message });
  }
}; 