const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { storage } = require('../config/multerConfig');
const { requireAuth } = require('../middleware/jwt');
const { extractStore, requireStoreAccess, addStoreFilter } = require('../middleware/storeIsolation');

// Import admin controller functions
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
    getDashboardStats
} = require('../controllers/adminController');

const upload = multer({ storage });

// Debug route to check store isolation
router.get('/debug/store-info', requireAuth, (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            email: req.user.email,
            isPlatformAdmin: req.user.isPlatformAdmin,
            ownedStores: req.user.ownedStores,
            adminStores: req.user.adminStores
        },
        store: req.store ? {
            id: req.store._id,
            name: req.store.name,
            slug: req.store.slug,
            owner: req.store.owner
        } : null,
        headers: {
            host: req.get('host'),
            'x-store-slug': req.headers['x-store-slug']
        },
        query: req.query,
        params: req.params
    });
});

// Admin authentication pages (no store isolation needed)
router.get('/auth', (req, res) => {
    res.render('admin/auth/index');
});

router.get('/auth/sign-in', (req, res) => {
    res.render('admin/auth/sign-in');
});

router.get('/auth/sign-up', (req, res) => {
    res.render('admin/auth/sign-up');
});

router.get('/auth/forgot-password', (req, res) => {
    res.render('admin/auth/forgot-password');
});

router.get('/auth/reset-password', (req, res) => {
    res.render('admin/auth/reset-password');
});

// Admin dashboard (with store isolation)
router.get('/dashboard', requireAuth, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/dashboard');
});

// Admin dashboard API endpoint for statistics
router.get('/dashboard/stats', requireAuth, extractStore, requireStoreAccess('any'), getDashboardStats);

// Admin product management pages and API endpoints (with store isolation)
router.get('/products', requireAuth, extractStore, requireStoreAccess('any'), addStoreFilter, getAllProducts);
router.get('/products/add', requireAuth, extractStore, requireStoreAccess('any'), addProductPage);
router.post('/products', requireAuth, extractStore, requireStoreAccess('any'), upload.array('images', 5), createProduct);
router.get('/products/edit/:id', requireAuth, extractStore, requireStoreAccess('any'), editProductPage);
router.put('/products/:id', requireAuth, extractStore, requireStoreAccess('any'), upload.array('images', 5), updateProduct);
router.delete('/products/:id', requireAuth, extractStore, requireStoreAccess('any'), removeProduct);
router.delete('/products/delete/:id', requireAuth, extractStore, requireStoreAccess('any'), deleteProduct);

// Admin product API endpoints
router.get('/products/count', requireAuth, extractStore, requireStoreAccess('any'), getProductCount);
router.get('/products/featured/:count', requireAuth, extractStore, requireStoreAccess('any'), getFeaturedProducts);

// Admin customer management pages (with store isolation)
router.get('/customers', requireAuth, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('apps/e-commerce/admin/customers');
});

router.get('/customers/:id', requireAuth, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('apps/e-commerce/admin/customer-details');
});

// Admin order management pages (with store isolation)
router.get('/orders', requireAuth, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('apps/e-commerce/admin/orders');
});

router.get('/orders/:id', requireAuth, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('apps/e-commerce/admin/order-details');
});

router.get('/refund', requireAuth, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('apps/e-commerce/admin/refund');
});

module.exports = router; 