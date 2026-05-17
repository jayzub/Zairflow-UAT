const express = require('express');
const { isAdminRegistrationEnabled } = require('../../config/adminRegistration');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.adminRegistrationEnabled = isAdminRegistrationEnabled();
  next();
});

// Admin auth UI pages (no store isolation needed)
router.get('/auth', (req, res) => {
  res.render('admin/auth/index');
});

router.get('/auth/sign-in', (req, res) => {
  res.render('admin/auth/sign-in');
});

router.get('/auth/sign-up', (req, res) => {
  const template = isAdminRegistrationEnabled()
    ? 'admin/auth/sign-up-form'
    : 'admin/auth/registration-closed';
  res.render(template);
});

router.get('/auth/forgot-password', (req, res) => {
  res.render('admin/auth/forgot-password');
});

router.get('/auth/reset-password', (req, res) => {
  res.render('admin/auth/reset-password');
});

module.exports = router;
