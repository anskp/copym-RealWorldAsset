const express = require('express');
const router = express.Router();
const vaultsController = require('../../controllers/fireblocks/vaults.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isIssuer } = require('../../middleware/role.middleware');

// Public routes for testing
router.post('/createvault', vaultsController.createVault);
router.get('/getvault/:id', vaultsController.getVault);
router.post('/vault/accounts/:vaultId/:assetId', vaultsController.createWallet);
router.post('/vault/accounts/:vaultId/:assetId/activate', vaultsController.activateWallet);
router.put('/renamevault/:vaultId', vaultsController.renameVault);
router.get('/vault/accounts/:vaultId/:assetId', vaultsController.getVaultAssetBalance);
router.post('/vault/accounts/:vaultId/:assetId/balance', vaultsController.refreshVaultAssetBalance);

// Protected routes (requires authentication and issuer role)
router.post('/setup/:issuerId', isAuthenticated, isIssuer, vaultsController.setupIssuerWallet);
router.get('/status/:issuerId', isAuthenticated, isIssuer, vaultsController.checkSetupStatus);

module.exports = router; 