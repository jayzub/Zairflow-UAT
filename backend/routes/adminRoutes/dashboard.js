const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const { getDashboardStats } = require('../../controllers/adminControllers/dashboard');

// Admin index (with store isolation and permission)
router.get('/', requireAuth, requirePermission('analytics:read'), checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/admin-index');
});

// Admin dashboard (analytics and statistics)
router.get('/dashboard', requireAuth, requirePermission('analytics:read'), checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/dashboard');
});

// Admin dashboard API endpoint for statistics
router.get('/dashboard/stats', requireAuth, requirePermission('analytics:read'), checkUserStores, extractStore, requireStoreAccess('any'), getDashboardStats);

// Admin profile page (any authenticated admin)
router.get('/profile', requireAuth, (req, res) => {
  res.render('admin/profile');
});

module.exports = router; 