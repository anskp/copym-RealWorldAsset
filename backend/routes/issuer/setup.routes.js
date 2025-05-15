const express = require('express');
const router = express.Router();
const setupController = require('../../controllers/issuer/setup.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isIssuer } = require('../../middleware/role.middleware');

// All routes in this file require authentication and issuer role
router.use(isAuthenticated);
router.use(isIssuer);

// Get setup options
router.get('/options', setupController.getSetupOptions);

// Update preferences
router.put('/preferences', setupController.updatePreferences);

// Complete setup (create vault and wallet)
router.post('/complete', setupController.completeSetup);

// Check setup status
router.get('/status', setupController.checkStatus);

module.exports = router; 