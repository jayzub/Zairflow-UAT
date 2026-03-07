const { body, param } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

const VALID_ROLES = ['store_owner', 'store_admin', 'platform_admin', 'admin'];

const validateAdminLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().withMessage('Password is required').notEmpty().withMessage('Password is required'),
  validateRequest,
];

const validateAdminRegister = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().withMessage('Password is required').isLength({ min: 1 }).withMessage('Password is required'),
  body('phone').isString().withMessage('Phone is required').notEmpty().withMessage('Phone is required'),
  body('role').optional().isIn(VALID_ROLES).withMessage('Invalid role'),
  body('position').optional().isString(),
  body('department').optional().isString(),
  body('isAdmin').optional().isBoolean().withMessage('isAdmin must be boolean'),
  validateRequest,
];

const validateMeUpdate = [
  body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Name must be between 1 and 200 characters'),
  body('phone').optional().isString(),
  body('position').optional().isString(),
  body('department').optional().isString(),
  body('preferences').optional().isObject().withMessage('preferences must be an object'),
  validateRequest,
];

const validateChangePassword = [
  body('currentPassword').isString().withMessage('Current password is required').notEmpty().withMessage('Current password is required'),
  body('newPassword').isString().withMessage('New password is required').notEmpty().withMessage('New password is required'),
  validateRequest,
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  validateRequest,
];

const validateResetPassword = [
  body('token').isString().withMessage('Reset token is required').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isString().withMessage('New password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest,
];

const validateCreateAdmin = [
  body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('firstName is required'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('lastName is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().withMessage('Password is required').notEmpty().withMessage('Password is required'),
  body('role').optional().isIn(VALID_ROLES).withMessage('Invalid role'),
  body('storeId').optional().isMongoId().withMessage('Invalid storeId'),
  validateRequest,
];

const validateCreateStoreAdmin = [
  body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('firstName is required'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('lastName is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().withMessage('Password is required').notEmpty().withMessage('Password is required'),
  body('phone').isString().withMessage('Phone is required').notEmpty().withMessage('Phone is required'),
  body('position').optional().isString(),
  body('department').optional().isString(),
  body('storeId').optional().isMongoId().withMessage('Invalid storeId'),
  validateRequest,
];

const validateUserIdParam = [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validateRequest,
];

const validateUpdateUser = [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('role').optional().isIn(VALID_ROLES).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  validateRequest,
];

module.exports = {
  validateAdminLogin,
  validateAdminRegister,
  validateMeUpdate,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateCreateAdmin,
  validateCreateStoreAdmin,
  validateUserIdParam,
  validateUpdateUser,
};

