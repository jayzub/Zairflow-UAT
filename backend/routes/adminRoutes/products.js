const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../../config/multerConfig');
const { requireAuth } = require('../../middleware/jwt');
const { extractStore, requireStoreAccess, addStoreFilter } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');

// Import product controller functions
const {
    getAllProducts,
    addProductPage,
    createProduct,
    editProductPage,
    updateProduct,
    removeProduct,
    deleteProduct,
    getProductCount,
    getFeaturedProducts
} = require('../../controllers/adminControllers/products');

const upload = multer({ storage });

// Admin product management pages and API endpoints (with store isolation)
router.get('/products', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addStoreFilter, getAllProducts);
router.get('/products/add', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addProductPage);
router.post('/products', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), upload.array('images', 5), createProduct);
router.get('/products/edit/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), editProductPage);
router.put('/products/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), upload.array('images', 5), updateProduct);
router.delete('/products/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), removeProduct);
router.delete('/products/delete/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), deleteProduct);

// Admin product API endpoints
router.get('/products/count', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getProductCount);
router.get('/products/featured/:count', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getFeaturedProducts);

module.exports = router; 