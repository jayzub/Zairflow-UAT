const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { requireAuth } = require('../middleware/jwt');
const { requireStoreAccess } = require('../middleware/storeIsolation');

// Import new middleware
const {
    validateStoreCreation,
    validateStoreUpdate,
    validateStoreId,
    validateStoreDiscovery,
    validateAddAdmin,
    validateRemoveAdmin,
    validateStoreSettings,
    validateStoreTheme
} = require('../middleware/validation');

const {
    storeCreationLimit,
    storeUpdateLimit,
    storeDiscoveryLimit,
    adminOperationLimit,
    analyticsLimit,
    settingsUpdateLimit,
    themeUpdateLimit
} = require('../middleware/rateLimiting');

const {
    sanitizeStoreCreation,
    sanitizeStoreUpdate,
    sanitizeAdminEmailMiddleware,
    sanitizeSearchQuery
} = require('../middleware/sanitization');

const {
    checkAdminLimit,
    checkAnalyticsAccess
} = require('../middleware/subscriptionLimits');


// Public routes (for store discovery) - MUST COME BEFORE PARAMETERIZED ROUTES
router.get('/discover', 
    storeDiscoveryLimit,
    sanitizeSearchQuery,
    validateStoreDiscovery,
    storeController.discoverStores
);

// Protected routes - require authentication
router.use(requireAuth);

// Store management routes - SPECIFIC ROUTES FIRST
router.post('/', 
    storeCreationLimit,
    sanitizeStoreCreation,
    validateStoreCreation,
    storeController.createStore
);

router.get('/my-stores', storeController.getUserStores);

// PARAMETERIZED ROUTES LAST - Order matters!
router.get('/:id/theme', 
    validateStoreId,
    requireStoreAccess('admin'),
    storeController.getStoreTheme
);

router.put('/:id/theme', 
    validateStoreId,
    themeUpdateLimit,
    sanitizeStoreUpdate,
    validateStoreTheme,
    requireStoreAccess('owner'),
    storeController.updateStoreTheme
);

router.get('/:id/analytics', 
    validateStoreId,
    analyticsLimit,
    checkAnalyticsAccess,
    requireStoreAccess('admin'),
    storeController.getStoreAnalytics
);

router.get('/:id/settings', 
    validateStoreId,
    requireStoreAccess('admin'),
    storeController.getStoreSettings
);

router.put('/:id/settings', 
    validateStoreId,
    settingsUpdateLimit,
    sanitizeStoreUpdate,
    validateStoreSettings,
    requireStoreAccess('owner'),
    storeController.updateStoreSettings
);

router.post('/:id/admins', 
    validateStoreId,
    adminOperationLimit,
    sanitizeAdminEmailMiddleware,
    validateAddAdmin,
    checkAdminLimit,
    requireStoreAccess('owner'),
    storeController.addStoreAdmin
);

router.delete('/:id/admins', 
    validateStoreId,
    adminOperationLimit,
    validateRemoveAdmin,
    requireStoreAccess('owner'),
    storeController.removeStoreAdmin
);

// MOST GENERAL ROUTE LAST
router.get('/:id', 
    validateStoreId,
    storeController.getStore
);

router.put('/:id', 
    validateStoreId,
    storeUpdateLimit,
    sanitizeStoreUpdate,
    validateStoreUpdate,
    requireStoreAccess('owner'),
    storeController.updateStore
);

router.delete('/:id', 
    validateStoreId,
    requireStoreAccess('owner'),
    storeController.deleteStore
);

module.exports = router; 