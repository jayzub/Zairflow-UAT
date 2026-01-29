const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');

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
router.get('/vendors', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getAllVendors);
router.get('/vendors/add', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addVendorPage);
router.get('/vendors/edit/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), editVendorPage);
router.post('/vendors', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), createVendor);
router.put('/vendors/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), updateVendor);
router.delete('/vendors/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), deleteVendor);
router.get('/vendors/stats', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getVendorStats);

module.exports = router;
