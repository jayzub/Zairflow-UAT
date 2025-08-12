const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
// const Category = require('../../models/category');

// Import categories controller functions
const {
    getAllCategories,
    addCategoryPage,
    editCategoryPage,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats
} = require('../../controllers/adminControllers/categories');

// Admin category management pages (with store isolation)
router.get('/categories', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getAllCategories);
router.get('/categories/add', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addCategoryPage);
router.get('/categories/edit/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), editCategoryPage);
router.post('/categories', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), createCategory);
router.put('/categories/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), updateCategory);
router.delete('/categories/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), deleteCategory);
router.get('/categories/stats', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getCategoryStats);

module.exports = router; 