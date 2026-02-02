const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
// const Category = require('../../models/category');
const {
    validateCategoryIdParam,
    validateCreateCategory,
    validateUpdateCategory,
    validateCompatibleCategoriesQuery
} = require('../../validators/admin/categoriesValidators');

// Import categories controller functions
const {
    getAllCategories,
    addCategoryPage,
    editCategoryPage,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats,
    getCompatibleCategories
} = require('../../controllers/adminControllers/categories');

// Admin category management pages (with store isolation)
router.get('/categories', requireAuth, requirePermission('category:read'), checkUserStores, extractStore, requireStoreAccess('any'), getAllCategories);
router.get('/categories/add', requireAuth, requirePermission('category:create'), checkUserStores, extractStore, requireStoreAccess('any'), addCategoryPage);
router.get('/categories/edit/:id', requireAuth, requirePermission('category:read'), checkUserStores, extractStore, requireStoreAccess('any'), validateCategoryIdParam, editCategoryPage);
router.post('/categories', requireAuth, requirePermission('category:create'), checkUserStores, extractStore, requireStoreAccess('any'), validateCreateCategory, createCategory);
router.put('/categories/:id', requireAuth, requirePermission('category:update'), checkUserStores, extractStore, requireStoreAccess('any'), validateUpdateCategory, updateCategory);
router.delete('/categories/:id', requireAuth, requirePermission('category:delete'), checkUserStores, extractStore, requireStoreAccess('any'), validateCategoryIdParam, deleteCategory);
router.get('/categories/stats', requireAuth, requirePermission('analytics:read'), checkUserStores, extractStore, requireStoreAccess('any'), getCategoryStats);
router.get('/categories/compatible', requireAuth, requirePermission('category:read'), checkUserStores, extractStore, requireStoreAccess('any'), validateCompatibleCategoriesQuery, getCompatibleCategories);

module.exports = router; 