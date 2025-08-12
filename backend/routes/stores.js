const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// Import middleware for public routes
const {
    validateStoreDiscovery
} = require('../middleware/validation');

const {
    storeDiscoveryLimit
} = require('../middleware/rateLimiting');

const {
    sanitizeSearchQuery
} = require('../middleware/sanitization');

// Public routes (for store discovery)
router.get('/discover', 
    storeDiscoveryLimit,
    sanitizeSearchQuery,
    validateStoreDiscovery,
    storeController.discoverStores
);

module.exports = router; 