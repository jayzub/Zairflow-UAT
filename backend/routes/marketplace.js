const express = require('express');
const router = express.Router();

const { getAllProductsMarketplace, getProductById } = require('../controllers/productController');
const { extractStoreOptional } = require('../middleware/storeIsolation');

// GET /api/marketplace/products -> same handler as GET /api/products/marketplace
router.get('/products', getAllProductsMarketplace);
// GET /api/marketplace/products/:id -> product detail when coming from marketplace (no store context)
router.get('/products/:id', extractStoreOptional, getProductById);

module.exports = router;
