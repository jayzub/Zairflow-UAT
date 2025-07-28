const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { storage } = require('../config/multerConfig');
const { requireAuth } = require('../middleware/jwt');
const { extractStore, requireStoreAccess, addStoreFilter } = require('../middleware/storeIsolation');
const { requirePermission, requireMinimumRole, requireRole } = require('../middleware/rbac');
const User = require('../models/user');

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

// Custom middleware to check if user has stores and redirect accordingly
const checkUserStores = async (req, res, next) => {
    try {
        // Platform admins can always access dashboard
        if (req.user.isPlatformAdmin) {
            return next();
        }
        
        // Check if user has any stores
        const user = await User.findById(req.user._id)
            .populate('ownedStores')
            .populate('adminStores');
        
        const hasStores = (user.ownedStores && user.ownedStores.length > 0) || 
                         (user.adminStores && user.adminStores.length > 0);
        
        if (!hasStores) {
            // User has no stores, redirect to create-store page
            return res.redirect('admin/create-store');
        }
        
        // User has stores, proceed with normal flow
        next();
    } catch (error) {
        console.error('Check user stores error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin index (with store isolation)
router.get('/', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/admin-index');
});

// Admin dashboard (analytics and statistics)
router.get('/dashboard', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/dashboard');
});

// Admin dashboard API endpoint for statistics
router.get('/dashboard/stats', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getDashboardStats);

// Admin store management pages (no store isolation needed for creating stores)
router.get('/create-store', requireAuth, requirePermission('store:create'), (req, res) => {
    res.render('admin/create-store');
});

// Admin user management pages (no store isolation needed for creating admins)
router.get('/create-admin', requireAuth, requirePermission('user:create_admin'), (req, res) => {
    res.render('admin/create-admin');
});

// Admin product management pages and API endpoints (with store isolation)
router.get('/products', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addStoreFilter, getAllProducts);
router.get('/products/add', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), addProductPage);
router.post('/products', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), upload.array('images', 5), createProduct);
router.get('/products/edit/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), editProductPage);
router.put('/products/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), upload.array('images', 5), updateProduct);
router.delete('/products/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), removeProduct);
router.delete('/products/delete/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), deleteProduct);

// Admin product API endpoints
router.get('/products/count', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getProductCount);
router.get('/products/featured/:count', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getFeaturedProducts);

// Admin customer management pages (with store isolation)
router.get('/customers', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/customers');
});

router.get('/customers/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/customer-details');
});

// Admin order management pages (with store isolation)
router.get('/orders', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/orders');
});

router.get('/orders/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/order-details');
});

router.get('/refund', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/refund');
});

module.exports = router; 