const express = require('express');
const router = express.Router();
const fireblocksController = require('../controllers/fireblocks-controller');

// Vault management
router.post('/vault', fireblocksController.createVault);
router.get('/vault/:id', fireblocksController.getVault);
router.put('/vault/:vaultId', fireblocksController.renameVault);

// Asset and wallet management
router.post('/vault/:vaultId/:assetId/wallet', fireblocksController.createWallet);
router.post('/vault/:vaultId/:assetId/activate', fireblocksController.activateWallet);
router.get('/vault/:vaultId/:assetId/balance', fireblocksController.getVaultAssetBalance);
router.post('/vault/:vaultId/:assetId/balance/refresh', fireblocksController.refreshVaultAssetBalance);

module.exports = router; 