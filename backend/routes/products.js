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
// const { requireAuth } = require('../middleware/jwt');

const upload = multer({ storage });


// Define routes - SPECIFIC ROUTES FIRST (before parameterized routes)
router.get('/test-ajax', testAjax);
router.get('/marketplace', getAllProductsMarketplace); // Main product browsing route
router.get('/store/:storeSlug', getStoreProducts); // Store-specific products
router.get('/:id', getProductById);

module.exports = router;
