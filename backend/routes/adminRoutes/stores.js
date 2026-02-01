const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess, addStoreFilter } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const {
    validateStoreCreation,
    validateStoreUpdate,
    validateStoreId,
    validateAddAdmin,
    validateRemoveAdmin,
    validateStoreSettings,
    validateStoreTheme
} = require('../../middleware/validation');

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
// Note: create-store routes don't use checkUserStores, extractStore, or requireStoreAccess
// because users creating their first store won't have a store context yet
router.get('/create-store', requireAuth, requirePermission('store:create'), createStorePage);
router.post('/stores', requireAuth, requirePermission('store:create'), validateStoreCreation, createStore);
// Get user's stores (this should be before /:id routes to avoid conflicts)
router.get('/stores/my-stores', requireAuth, requirePermission('store:read'), getUserStores);
// Backwards-compatible alias (older admin pages call /admin/my-stores)
router.get('/my-stores', requireAuth, requirePermission('store:read'), getUserStores);
// List stores page
router.get('/stores/list', requireAuth, requirePermission('store:read'), listStoresPage);
router.get('/stores/:id', requireAuth, requirePermission('store:read'), validateStoreId, checkUserStores, extractStore, requireStoreAccess('any'), getStoreDetails);
router.put('/stores/:id', requireAuth, requirePermission('store:update'), validateStoreUpdate, checkUserStores, extractStore, requireStoreAccess('any'), updateStore);
router.delete('/stores/:id', requireAuth, requirePermission('store:delete'), validateStoreId, checkUserStores, extractStore, requireStoreAccess('any'), deleteStore);

// Admin store analytics
router.get('/stores/:id/analytics', requireAuth, requirePermission('analytics:read'), validateStoreId, checkUserStores, extractStore, requireStoreAccess('any'), getStoreAnalytics);

// Admin store settings
router.get('/stores/:id/settings', requireAuth, requirePermission('store:settings'), validateStoreId, checkUserStores, extractStore, requireStoreAccess('any'), getStoreSettings);
router.put('/stores/:id/settings', requireAuth, requirePermission('store:settings'), validateStoreSettings, checkUserStores, extractStore, requireStoreAccess('any'), updateStoreSettings);

// Admin store theme
router.get('/stores/:id/theme', requireAuth, requirePermission('store:settings'), validateStoreId, checkUserStores, extractStore, requireStoreAccess('any'), getStoreTheme);
router.put('/stores/:id/theme', requireAuth, requirePermission('store:settings'), validateStoreTheme, checkUserStores, extractStore, requireStoreAccess('any'), updateStoreTheme);

// Admin store admin management
router.post('/stores/:id/admins', requireAuth, requirePermission('store:update'), validateAddAdmin, checkUserStores, extractStore, requireStoreAccess('any'), addStoreAdmin);
router.delete('/stores/:id/admins', requireAuth, requirePermission('store:update'), validateRemoveAdmin, checkUserStores, extractStore, requireStoreAccess('any'), removeStoreAdmin);

module.exports = router; 