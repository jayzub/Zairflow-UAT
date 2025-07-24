const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { requireAuth } = require('../middleware/jwt');

// Middleware to check if user is platform admin
const requirePlatformAdmin = (req, res, next) => {
    if (!req.user || !req.user.isPlatformAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Platform admin access required'
        });
    }
    next();
};

// All routes require authentication and platform admin access
router.use(requireAuth);
router.use(requirePlatformAdmin);

// Platform overview and analytics
router.get('/overview', platformController.getPlatformOverview);
router.get('/analytics', platformController.getPlatformAnalytics);

// Store management
router.get('/stores', platformController.getAllStores);
router.get('/stores/:storeId', platformController.getStoreDetails);
router.put('/stores/:storeId/subscription', platformController.updateStoreSubscription);
router.put('/stores/:storeId/verify', platformController.verifyStore);
router.put('/stores/:storeId/status', platformController.toggleStoreStatus);

module.exports = router; 