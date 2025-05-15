const express = require('express');
const router = express.Router();
const { authenticateJWT, isIssuer: authIsIssuer } = require('../../middleware/auth');
const issuerController = require('../../controllers/issuer/issuer.controller');
const setupRoutes = require('./setup.routes');

// Include setup routes - use authenticateJWT middleware first, then the isIssuer middleware
// This ensures proper authentication and role verification for all setup routes
router.use('/setup', authenticateJWT, authIsIssuer, setupRoutes);

// Basic profile routes
router.get('/me', authenticateJWT, issuerController.getProfile);
router.get('/profile', authenticateJWT, authIsIssuer, issuerController.getProfile);
router.get('/dashboard', authenticateJWT, authIsIssuer, issuerController.getProfile);
router.put('/profile', authenticateJWT, authIsIssuer, issuerController.updateProfile);

// KYC related routes
router.get('/kyc-status', authenticateJWT, issuerController.getKycStatus);
router.get('/kyc-verification-url', authenticateJWT, authIsIssuer, issuerController.getKycVerificationUrl);

// Offering related routes
router.get('/offerings', authenticateJWT, authIsIssuer, issuerController.getOfferings);
router.post('/offerings', authenticateJWT, authIsIssuer, issuerController.createOffering);
router.get('/offerings/:offeringId', authenticateJWT, authIsIssuer, issuerController.getOfferingDetails);
router.put('/offerings/:offeringId', authenticateJWT, authIsIssuer, issuerController.updateOffering);
router.post('/offerings/:offeringId/documents', authenticateJWT, authIsIssuer, issuerController.uploadDocument);

// Export router and middleware from the auth file
module.exports = router;
module.exports.isIssuer = authIsIssuer; 