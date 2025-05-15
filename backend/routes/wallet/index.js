const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../../middleware/auth');
const walletController = require('../../controllers/wallet/wallet.controller');

// Middleware to check if user is an issuer
const checkIssuerRole = (req, res, next) => {
  try {
    // JWT authentication is already handled by authenticateJWT middleware
    // Just check if the user has the ISSUER role
    if (!req.user || !req.user.userrole || !Array.isArray(req.user.userrole) || 
        !req.user.userrole.some(role => role.role === 'ISSUER')) {
      return res.status(403).json({ message: 'Forbidden - Issuer access required' });
    }
    
    next();
  } catch (error) {
    console.error('Error in isIssuer middleware:', error);
    return res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

// Wallet management routes - apply authenticateJWT before checkIssuerRole
router.get('/', authenticateJWT, checkIssuerRole, walletController.getWallet);
router.post('/create', authenticateJWT, checkIssuerRole, walletController.createWallet);
router.get('/balance', authenticateJWT, checkIssuerRole, walletController.getWalletBalance);
router.get('/nfts', authenticateJWT, checkIssuerRole, walletController.getWalletNFTs);
router.get('/transactions', authenticateJWT, checkIssuerRole, walletController.getWalletTransactions);

module.exports = router; 