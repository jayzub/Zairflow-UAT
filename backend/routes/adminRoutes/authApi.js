const express = require('express');
const router = express.Router();

const { login, register, logout } = require('../../controllers/adminControllers/adminAuthController');
const { validateAdminLogin, validateAdminRegister } = require('../../validators/admin/usersValidators');
const { adminLoginLimit, adminRegisterLimit } = require('../../middleware/rateLimiting');

// Admin auth JSON endpoints (no store isolation needed)
router.post('/login', adminLoginLimit, validateAdminLogin, login);
router.post('/register', adminRegisterLimit, validateAdminRegister, register);
router.post('/logout', logout);
router.get('/logout', logout);

module.exports = router;

