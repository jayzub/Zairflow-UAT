const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const {
    customProductTypesPage,
    getCustomProductTypes,
    getCustomProductType,
    createCustomProductType,
    updateCustomProductType,
    deleteCustomProductType
} = require('../../controllers/adminControllers/customProductTypes');

// Handle both page and API requests for the root route
router.get('/', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), async (req, res, next) => {
    // Check if this is an API request
    const isApiRequest = req.xhr || 
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        (req.headers['accept'] && req.headers['accept'].includes('application/json'));
    
    if (isApiRequest) {
        // This is an API request, call the API handler
        return getCustomProductTypes(req, res, next);
    }
    
    // This is a page request, render the page
    return customProductTypesPage(req, res, next);
});

// All other API routes require authentication and store access
router.use(requireAuth);
router.use(checkUserStores);
router.use(extractStore);
router.use(requireStoreAccess('any'));

// API endpoint for getting all custom product types (alternative endpoint)
router.get('/api', getCustomProductTypes);

// Get a single custom product type
router.get('/:id', getCustomProductType);

// Create a new custom product type
router.post('/', createCustomProductType);

// Update a custom product type
router.put('/:id', updateCustomProductType);

// Delete a custom product type (soft delete)
router.delete('/:id', deleteCustomProductType);

module.exports = router;

