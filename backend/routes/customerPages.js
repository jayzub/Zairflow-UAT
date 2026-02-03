const express = require('express');
const customerPagesController = require('../controllers/customerPagesController');
const { extractStore } = require('../middleware/storeIsolation');
const { optionalCustomerAuth } = require('../middleware/jwt');

const router = express.Router();

// Optional customer auth so navbar can show logged-in customer name (cookie customerToken)
router.use(optionalCustomerAuth);

// Customer-facing homepage (server-rendered Pug)
router.get('/home', extractStore, customerPagesController.renderCustomerHomepage);

// Backwards-compat redirects
router.get('/customers', extractStore, (req, res) => res.redirect(302, '/home'));
router.get('/customers/home', extractStore, (req, res) => res.redirect(302, '/home'));

module.exports = router;

