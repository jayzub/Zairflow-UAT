const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    getStoreProducts,
    getAllProductsMarketplace,
    getProductSuggestions,
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
// Store products page at /api/products when on store subdomain (e.g. perfume-store.localhost:3001/api/products)
router.get('/', extractStoreOptional, (req, res, next) => {
  if (req.store) {
    req.params.storeSlug = req.store.slug;
    return getStoreProducts(req, res, next);
  }
  next(); // no store context -> 404
});
// Search suggestions (as-you-type). Must be before /:id.
router.get('/suggestions', extractStoreOptional, getProductSuggestions);
// When accessed via store subdomain, scope product lookup to that store.
router.get('/:id', extractStoreOptional, getProductById);

module.exports = router;
