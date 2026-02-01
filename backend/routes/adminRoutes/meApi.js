const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../middleware/jwt');
const { getCurrentUser, updateCurrentUser, changePassword } = require('../../controllers/adminControllers/adminMeController');
const { validateMeUpdate, validateChangePassword } = require('../../validators/admin/usersValidators');

// Profile routes (place before /:id routes to avoid conflicts)
router.get('/me', requireAuth, getCurrentUser);
router.put('/me', requireAuth, validateMeUpdate, updateCurrentUser);

// Password management
router.post('/change-password', requireAuth, validateChangePassword, changePassword);

module.exports = router;

