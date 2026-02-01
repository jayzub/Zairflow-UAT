const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');

const { createAdminPage } = require('../../controllers/adminControllers/adminUsersController');

// Admin UI pages (store-aware where relevant)
router.get(
  '/create-admin',
  requireAuth,
  requirePermission('user:create_admin'),
  checkUserStores,
  extractStore,
  requireStoreAccess('any'),
  createAdminPage
);

// Preferred grouping (alias): /admin/pages/create-admin
router.get(
  '/pages/create-admin',
  requireAuth,
  requirePermission('user:create_admin'),
  checkUserStores,
  extractStore,
  requireStoreAccess('any'),
  createAdminPage
);

module.exports = router;

