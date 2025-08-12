const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public routes (for store frontend - customers can access)
router.get('/store/:storeSlug', categoryController.getAllCategories);
router.get('/store/:storeSlug/tree', categoryController.getCategoryTree);
router.get('/store/:storeSlug/:categoryId', categoryController.getCategoryById);
router.get('/store/:storeSlug/:categoryId/products', categoryController.getProductsByCategory);

module.exports = router;