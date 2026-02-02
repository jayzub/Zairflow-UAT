const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const { validateVendorIdParam, validateCreateVendor, validateUpdateVendor } = require('../../validators/admin/vendorsValidators');

// Import vendor controller functions
const {
    getAllVendors,
    addVendorPage,
    editVendorPage,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorStats
} = require('../../controllers/adminControllers/vendors');

// Admin vendor management pages (with store isolation)
router.get('/vendors', requireAuth, requirePermission('vendor:read'), checkUserStores, extractStore, requireStoreAccess('any'), getAllVendors);
router.get('/vendors/add', requireAuth, requirePermission('vendor:create'), checkUserStores, extractStore, requireStoreAccess('any'), addVendorPage);
router.get('/vendors/edit/:id', requireAuth, requirePermission('vendor:read'), checkUserStores, extractStore, requireStoreAccess('any'), validateVendorIdParam, editVendorPage);
router.post('/vendors', requireAuth, requirePermission('vendor:create'), checkUserStores, extractStore, requireStoreAccess('any'), validateCreateVendor, createVendor);
router.put('/vendors/:id', requireAuth, requirePermission('vendor:update'), checkUserStores, extractStore, requireStoreAccess('any'), validateUpdateVendor, updateVendor);
router.delete('/vendors/:id', requireAuth, requirePermission('vendor:delete'), checkUserStores, extractStore, requireStoreAccess('any'), validateVendorIdParam, deleteVendor);
router.get('/vendors/stats', requireAuth, requirePermission('analytics:read'), checkUserStores, extractStore, requireStoreAccess('any'), getVendorStats);

module.exports = router;
