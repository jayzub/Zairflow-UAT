const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { requirePermission } = require('../../middleware/rbac');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const { validateCustomerIdParam, validateCreateCustomer, validateUpdateCustomer } = require('../../validators/admin/customersValidators');

const {
    getAllCustomers,
    getCustomerDetails,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require('../../controllers/adminControllers/customers');

// Admin customer management pages (with store isolation)
router.get('/customers', requireAuth, requirePermission('customer:read'), checkUserStores, extractStore, requireStoreAccess('any'), getAllCustomers);

router.get('/customers/:id', requireAuth, requirePermission('customer:read'), checkUserStores, extractStore, requireStoreAccess('any'), validateCustomerIdParam, getCustomerDetails);

// Admin customer API endpoints
router.post('/customers', requireAuth, requirePermission('customer:create'), checkUserStores, extractStore, requireStoreAccess('any'), validateCreateCustomer, createCustomer);
router.put('/customers/:id', requireAuth, requirePermission('customer:update'), checkUserStores, extractStore, requireStoreAccess('any'), validateUpdateCustomer, updateCustomer);
router.delete('/customers/:id', requireAuth, requirePermission('customer:delete'), checkUserStores, extractStore, requireStoreAccess('any'), validateCustomerIdParam, deleteCustomer);

module.exports = router; 