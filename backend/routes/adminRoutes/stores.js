const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess, addStoreFilter } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');

// Import store controller functions
const {
    createStorePage,
    createStore,
    getStoreDetails,
    updateStore,
    deleteStore,
    getStoreAnalytics,
    addStoreAdmin,
    removeStoreAdmin,
    getStoreSettings,
    updateStoreSettings,
    getStoreTheme,
    updateStoreTheme,
    getUserStores,
    listStoresPage
} = require('../../controllers/adminControllers/stores');

// Admin store management pages and API endpoints (with store isolation)
router.get('/create-store', requireAuth, requirePermission('store:create'), checkUserStores, extractStore, requireStoreAccess('any'), createStorePage);
router.post('/stores', requireAuth, requirePermission('store:create'), checkUserStores, extractStore, requireStoreAccess('any'), createStore);
// Get user's stores (this should be before /:id routes to avoid conflicts)
router.get('/stores/my-stores', requireAuth, getUserStores);
// List stores page
router.get('/stores/list', requireAuth, listStoresPage);
router.get('/stores/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getStoreDetails);
router.put('/stores/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), updateStore);
router.delete('/stores/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), deleteStore);

// Admin store analytics
router.get('/stores/:id/analytics', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getStoreAnalytics);

// Admin store settings
router.get('/stores/:id/settings', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getStoreSettings);
router.put('/stores/:id/settings', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), updateStoreSettings);

// Admin store theme
router.get('/stores/:id/theme', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getStoreTheme);
router.put('/stores/:id/theme', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), updateStoreTheme);

// Admin store admin management
router.post('/stores/:id/admins', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addStoreAdmin);
router.delete('/stores/:id/admins', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), removeStoreAdmin);

module.exports = router; 