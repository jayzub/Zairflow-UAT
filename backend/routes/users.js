const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/jwt');
const { requirePermission, requireMinimumRole, requireRole } = require('../middleware/rbac');

// Authentication routes
router.post('/login', userController.login);
router.post('/register', userController.register);

// Profile routes (place before /:id routes to avoid conflicts)
router.get('/me', requireAuth, userController.getCurrentUser);
router.put('/me', requireAuth, userController.updateCurrentUser);

// Admin routes
router.get('/', requireAuth, userController.getAllUsers);
router.get('/get/count', requireAuth, userController.getUserCount);

// User management routes
router.get('/:id', requireAuth, userController.getUserById);
router.put('/:id', requireAuth, userController.updateUser);
router.delete('/:id', requireAuth, userController.deleteUser);

// Password and admin management
router.post('/change-password', requireAuth, userController.changePassword);
router.post('/create-store-admin', requireAuth, requirePermission('user:create_admin'), userController.createStoreAdmin);

module.exports = router; 