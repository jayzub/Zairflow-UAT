const express = require('express');
const { extractStoreOptional } = require('../middleware/storeIsolation');

const router = express.Router();

// Customer authentication UI pages (server-rendered Pug)
router.get('/customers/sign-in', extractStoreOptional, (req, res) => {
  res.render('landing/auth/customer-sign-in', {
    store: req.store || null,
    isCustomerStorefront: true,
  });
});

router.get('/customers/sign-up', extractStoreOptional, (req, res) => {
  res.render('landing/auth/customer-sign-up', {
    store: req.store || null,
    isCustomerStorefront: true,
  });
});

module.exports = router;

