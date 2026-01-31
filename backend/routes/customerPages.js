const express = require('express');
const customerPagesController = require('../controllers/customerPagesController');
const { extractStore } = require('../middleware/storeIsolation');
const { getStoreProducts } = require('../controllers/productController');

const router = express.Router();

// Customer-facing homepage (server-rendered Pug)
router.get('/home', extractStore, customerPagesController.renderCustomerHomepage);

// Store products page for current store (resolved by subdomain)
router.get('/products', extractStore, (req, res, next) => {
  req.params.storeSlug = req.store.slug;
  return getStoreProducts(req, res, next);
});

// Backwards-compat redirects
router.get('/customers', extractStore, (req, res) => res.redirect(302, '/home'));
router.get('/customers/home', extractStore, (req, res) => res.redirect(302, '/home'));

module.exports = router;

