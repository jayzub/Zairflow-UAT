const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');

// Import all user controller functions
const {
    login,
    register,
    getCurrentUser,
    updateCurrentUser,
    changePassword,
    createAdminPage,
    createAdmin,
    getAllUsers,
    getUserCount,
    getUserDetails,
    updateUser,
    deleteUser,
    createStoreAdmin
} = require('../../controllers/adminControllers/users');

// Authentication page routes (no store isolation needed)
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

// Authentication API routes (no store isolation needed)
router.post('/login', login);
router.post('/register', register);

// Profile routes (place before /:id routes to avoid conflicts)
router.get('/me', requireAuth, getCurrentUser);
router.put('/me', requireAuth, updateCurrentUser);

// Password management
router.post('/change-password', requireAuth, changePassword);

// Admin user management pages and API endpoints (with store isolation)
router.get('/create-admin', requireAuth, requirePermission('user:create_admin'), checkUserStores, extractStore, requireStoreAccess('any'), createAdminPage);
router.post('/admins', requireAuth, requirePermission('user:create_admin'), checkUserStores, extractStore, requireStoreAccess('any'), createAdmin);
router.get('/users', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getAllUsers);
router.get('/users/count', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getUserCount);
router.get('/users/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), getUserDetails);
router.put('/users/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), updateUser);
router.delete('/users/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), deleteUser);

// Store admin management
router.post('/create-store-admin', requireAuth, requirePermission('user:create_admin'), checkUserStores, extractStore, requireStoreAccess('any'), createStoreAdmin);

module.exports = router; 