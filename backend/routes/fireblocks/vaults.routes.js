const express = require('express');
const vaultsController = require('../../controllers/fireblocks/vaults.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/fireblocks/vaults/:id
 * @desc Get a vault by ID
 * @access Private (requires authentication)
 */
router.get('/:id', authMiddleware.isAuthenticated, vaultsController.getVault);

/**
 * @route POST /api/fireblocks/vaults
 * @desc Create a new vault
 * @access Private (requires authentication)
 */
router.post('/', authMiddleware.isAuthenticated, vaultsController.createVault);

/**
 * @route PUT /api/fireblocks/vaults/:vaultId
 * @desc Rename a vault
 * @access Private (requires authentication)
 */
router.put('/:vaultId', authMiddleware.isAuthenticated, vaultsController.renameVault);

/**
 * @route POST /api/fireblocks/vaults/:vaultId/:assetId
 * @desc Create a wallet in a vault
 * @access Private (requires authentication)
 */
router.post('/:vaultId/:assetId', authMiddleware.isAuthenticated, vaultsController.createWallet);

/**
 * @route POST /api/fireblocks/vaults/:vaultId/:assetId/activate
 * @desc Activate a wallet in a vault
 * @access Private (requires authentication)
 */
router.post('/:vaultId/:assetId/activate', authMiddleware.isAuthenticated, vaultsController.activateWallet);

/**
 * @route GET /api/fireblocks/vaults/:vaultId/:assetId
 * @desc Get vault asset balance
 * @access Private (requires authentication)
 */
router.get('/:vaultId/:assetId', authMiddleware.isAuthenticated, vaultsController.getVaultAssetBalance);

/**
 * @route POST /api/fireblocks/vaults/:vaultId/:assetId/balance
 * @desc Refresh vault asset balance
 * @access Private (requires authentication)
 */
router.post('/:vaultId/:assetId/balance', authMiddleware.isAuthenticated, vaultsController.refreshVaultAssetBalance);

/**
 * @route POST /api/fireblocks/vaults/issuer/:issuerId/setup
 * @desc Setup issuer wallet
 * @access Private (requires authentication)
 */
router.post('/issuer/:issuerId/setup', authMiddleware.isAuthenticated, vaultsController.setupIssuerWallet);

/**
 * @route GET /api/fireblocks/vaults/issuer/:issuerId/status
 * @desc Check issuer wallet setup status
 * @access Private (requires authentication)
 */
router.get('/issuer/:issuerId/status', authMiddleware.isAuthenticated, vaultsController.checkSetupStatus);

module.exports = router;