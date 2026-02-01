const express = require('express');
const router = express.Router();

const { login, register } = require('../../controllers/adminControllers/adminAuthController');
const { validateAdminLogin, validateAdminRegister } = require('../../validators/admin/usersValidators');

// Admin auth JSON endpoints (no store isolation needed)
router.post('/login', validateAdminLogin, login);
router.post('/register', validateAdminRegister, register);

module.exports = router;

