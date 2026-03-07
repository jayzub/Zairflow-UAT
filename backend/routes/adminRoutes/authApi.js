const express = require('express');
const router = express.Router();

const { login, register, logout, forgotPassword, resetPassword } = require('../../controllers/adminControllers/adminAuthController');
const { validateAdminLogin, validateAdminRegister, validateForgotPassword, validateResetPassword } = require('../../validators/admin/usersValidators');
const { adminLoginLimit, adminRegisterLimit, adminForgotPasswordLimit } = require('../../middleware/rateLimiting');

// Admin auth JSON endpoints (no store isolation needed)
router.post('/login', adminLoginLimit, validateAdminLogin, login);
router.post('/register', adminRegisterLimit, validateAdminRegister, register);
router.post('/logout', logout);
router.get('/logout', logout);
router.post('/forgot-password', adminForgotPasswordLimit, validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

module.exports = router;

