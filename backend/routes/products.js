const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    getStoreProducts,
    getAllProductsMarketplace,
    testAjax,
    getProductById
} = require('../controllers/productController');
const { storage } = require('../config/multerConfig');
const { extractStoreOptional } = require('../middleware/storeIsolation');
// const { requireAuth } = require('../middleware/jwt');

const upload = multer({ storage });


// Define routes - SPECIFIC ROUTES FIRST (before parameterized routes)
router.get('/test-ajax', testAjax);
router.get('/marketplace', getAllProductsMarketplace); // Main product browsing route
router.get('/store/:storeSlug', getStoreProducts); // Store-specific products
// When accessed via store subdomain, scope product lookup to that store.
router.get('/:id', extractStoreOptional, getProductById);

module.exports = router;
