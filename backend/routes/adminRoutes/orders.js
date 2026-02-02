const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const { validateOrderIdParam, validateUpdateOrderStatus, validateProcessRefund } = require('../../validators/admin/ordersValidators');

const {
    getAllOrders,
    getOrderDetails,
    updateOrderStatus,
    processRefund,
    getRefundPage
} = require('../../controllers/adminControllers/orders');

// Admin order management pages (with store isolation)
router.get('/orders', requireAuth, requirePermission('order:read'), checkUserStores, extractStore, requireStoreAccess('any'), getAllOrders);

router.get('/orders/:id', requireAuth, requirePermission('order:read'), checkUserStores, extractStore, requireStoreAccess('any'), validateOrderIdParam, getOrderDetails);

router.get('/refund', requireAuth, requirePermission('order:read'), checkUserStores, extractStore, requireStoreAccess('any'), getRefundPage);

// Admin order API endpoints
router.put('/orders/:id/status', requireAuth, requirePermission('order:update'), checkUserStores, extractStore, requireStoreAccess('any'), validateUpdateOrderStatus, updateOrderStatus);
router.post('/orders/:id/refund', requireAuth, requirePermission('order:update'), checkUserStores, extractStore, requireStoreAccess('any'), validateProcessRefund, processRefund);

module.exports = router; 