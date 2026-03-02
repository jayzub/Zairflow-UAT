const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../../config/multerConfig');
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess, addStoreFilter } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const {
    validateProductIdParam,
    validateFeaturedCountParam,
    validateCreateProduct,
    validateUpdateProduct,
    validateProductsListQuery,
    validateBulkImport
} = require('../../validators/admin/productsValidators');

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
    getFeaturedProducts,
    importProductsPage,
    bulkImportProducts,
    downloadImportTemplate
} = require('../../controllers/adminControllers/products');

// Configure multer to accept images field and allow other form fields
const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

// Multer for CSV bulk import (memory storage)
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ext = (file.originalname || '').toLowerCase();
        if (!ext.endsWith('.csv')) {
            return cb(new Error('Only CSV files are allowed'), false);
        }
        cb(null, true);
    },
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
router.get('/products', requireAuth, requirePermission('product:read'), checkUserStores, extractStore, requireStoreAccess('any'), addStoreFilter, validateProductsListQuery, getAllProducts);
router.get('/products/add', requireAuth, requirePermission('product:create'), checkUserStores, extractStore, requireStoreAccess('any'), addProductPage);
router.get('/products/import', requireAuth, requirePermission('product:create'), checkUserStores, extractStore, requireStoreAccess('any'), importProductsPage);
router.get('/products/import/template', requireAuth, requirePermission('product:create'), checkUserStores, extractStore, requireStoreAccess('any'), downloadImportTemplate);
router.post('/products/import', requireAuth, requirePermission('product:create'), checkUserStores, extractStore, requireStoreAccess('any'), csvUpload.single('csv'), validateBulkImport, bulkImportProducts);
// Use upload.any() to accept files from any field, then filter in processUploadedFiles
router.post('/products', requireAuth, requirePermission('product:create'), checkUserStores, extractStore, requireStoreAccess('any'), upload.any(), processUploadedFiles, validateCreateProduct, createProduct);
router.get('/products/edit/:id', requireAuth, requirePermission('product:read'), checkUserStores, extractStore, requireStoreAccess('any'), validateProductIdParam, editProductPage);
router.put('/products/:id', requireAuth, requirePermission('product:update'), checkUserStores, extractStore, requireStoreAccess('any'), upload.array('images', 5), validateUpdateProduct, updateProduct);
router.delete('/products/:id', requireAuth, requirePermission('product:delete'), checkUserStores, extractStore, requireStoreAccess('any'), validateProductIdParam, removeProduct);
router.delete('/products/delete/:id', requireAuth, requirePermission('product:delete'), checkUserStores, extractStore, requireStoreAccess('any'), validateProductIdParam, deleteProduct);

// Admin product API endpoints
router.get('/products/count', requireAuth, requirePermission('product:read'), checkUserStores, extractStore, requireStoreAccess('any'), getProductCount);
router.get('/products/featured/:count', requireAuth, requirePermission('product:read'), checkUserStores, extractStore, requireStoreAccess('any'), validateFeaturedCountParam, getFeaturedProducts);

module.exports = router; 