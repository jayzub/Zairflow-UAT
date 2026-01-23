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

// Configure multer to accept images field and allow other form fields
const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

// Middleware to filter files and assign to req.files as 'images' array
const processUploadedFiles = (req, res, next) => {
    // If files were uploaded via upload.any(), filter for 'images' field
    if (req.files && Array.isArray(req.files)) {
        // Filter files from 'images' field and limit to 10
        req.files = req.files
            .filter(file => file.fieldname === 'images')
            .slice(0, 10);
    }
    next();
};

// Admin product management pages and API endpoints (with store isolation)
router.get('/products', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addStoreFilter, getAllProducts);
router.get('/products/add', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addProductPage);
// Use upload.any() to accept files from any field, then filter in processUploadedFiles
router.post('/products', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), upload.any(), processUploadedFiles, createProduct);
router.get('/products/edit/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), editProductPage);
router.put('/products/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), upload.array('images', 5), updateProduct);
router.delete('/products/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), removeProduct);
router.delete('/products/delete/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), deleteProduct);

// Admin product API endpoints
router.get('/products/count', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getProductCount);
router.get('/products/featured/:count', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getFeaturedProducts);

module.exports = router; 