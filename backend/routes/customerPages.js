const express = require('express');
const customerPagesController = require('../controllers/customerPagesController');
const { extractStore, extractStoreOptional } = require('../middleware/storeIsolation');
const { optionalCustomerAuth, requireCustomerAuth } = require('../middleware/jwt');

const router = express.Router();

// Optional customer auth so navbar can show logged-in customer name (cookie customerToken)
router.use(optionalCustomerAuth);

// Customer-facing homepage (server-rendered Pug)
router.get('/home', extractStore, customerPagesController.renderCustomerHomepage);

// Customer profile page (requires login; store optional for breadcrumb/context)
router.get('/profile', requireCustomerAuth, extractStoreOptional, customerPagesController.renderCustomerProfile);

// Cart page (scope from query: scopeType, storeId when scopeType=store; works with or without store)
router.get('/cart', extractStoreOptional, (req, res) => {
  const scopeType = req.query.scopeType || (req.store ? 'store' : 'marketplace');
  const storeId = req.query.storeId || (req.store && req.store._id ? String(req.store._id) : '');
  res.render('landing/cart', {
    cartScopeType: scopeType,
    cartStoreId: storeId,
    store: req.store || null,
    isCustomerStorefront: true,
  });
});

// Checkout page (requires login; scope from query or store context)
router.get('/checkout', requireCustomerAuth, extractStoreOptional, (req, res) => {
  const scopeType = req.query.scopeType || (req.store ? 'store' : 'marketplace');
  const storeId = req.query.storeId || (req.store && req.store._id ? String(req.store._id) : '');
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  res.render('landing/checkout', {
    cartScopeType: scopeType,
    cartStoreId: storeId,
    store: req.store || null,
    isCustomerStorefront: true,
    stripePublishableKey,
  });
});

// Order confirmation page (after place order)
router.get('/orders/confirmation/:orderId', requireCustomerAuth, customerPagesController.renderOrderConfirmation);

// Backwards-compat redirects
router.get('/customers', extractStore, (req, res) => res.redirect(302, '/home'));
router.get('/customers/home', extractStore, (req, res) => res.redirect(302, '/home'));

module.exports = router;

