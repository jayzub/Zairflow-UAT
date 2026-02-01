const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const { validateCreateAdmin, validateCreateStoreAdmin, validateUserIdParam, validateUpdateUser } = require('../../validators/admin/usersValidators');

// Import all user controller functions
const {
    createAdmin,
    getAllUsers,
    getUserCount,
    getUserDetails,
    updateUser,
    deleteUser,
    createStoreAdmin
} = require('../../controllers/adminControllers/adminUsersController');

// Admin user management API endpoints (with store isolation)
router.post('/admins', requireAuth, requirePermission('user:create_admin'), validateCreateAdmin, checkUserStores, extractStore, requireStoreAccess('any'), createAdmin);
router.get('/users', requireAuth, requirePermission('user:read'), checkUserStores, extractStore, requireStoreAccess('any'), getAllUsers);
router.get('/users/count', requireAuth, requirePermission('user:read'), checkUserStores, extractStore, requireStoreAccess('any'), getUserCount);
router.get('/users/:id', requireAuth, requirePermission('user:read'), validateUserIdParam, checkUserStores, extractStore, requireStoreAccess('any'), getUserDetails);
router.put('/users/:id', requireAuth, requirePermission('user:update'), validateUpdateUser, checkUserStores, extractStore, requireStoreAccess('any'), updateUser);
router.delete('/users/:id', requireAuth, requirePermission('user:delete'), validateUserIdParam, checkUserStores, extractStore, requireStoreAccess('any'), deleteUser);

// Store admin management
router.post('/create-store-admin', requireAuth, requirePermission('user:create_admin'), validateCreateStoreAdmin, checkUserStores, extractStore, requireStoreAccess('any'), createStoreAdmin);

module.exports = router; 