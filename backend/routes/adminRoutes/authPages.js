const express = require('express');
const router = express.Router();

// Admin auth UI pages (no store isolation needed)
router.get('/auth', (req, res) => {
  res.render('admin/auth/index');
});

router.get('/auth/sign-in', (req, res) => {
  res.render('admin/auth/sign-in');
});

router.get('/auth/sign-up', (req, res) => {
  res.render('admin/auth/sign-up');
});

router.get('/auth/forgot-password', (req, res) => {
  res.render('admin/auth/forgot-password');
});

router.get('/auth/reset-password', (req, res) => {
  res.render('admin/auth/reset-password');
});

module.exports = router;

