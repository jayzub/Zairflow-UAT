const { body, param } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

const validateVendorIdParam = [
  param('id').isMongoId().withMessage('Invalid vendor ID'),
  validateRequest,
];

const validateCreateVendor = [
  body('name').isString().withMessage('Vendor name is required').notEmpty().withMessage('Vendor name is required'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('description').optional().isString(),
  body('phone').optional().isString(),
  body('address').optional().isString(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  validateRequest,
];

const validateUpdateVendor = [
  param('id').isMongoId().withMessage('Invalid vendor ID'),
  body('name').optional().isString(),
  body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('description').optional().isString(),
  body('phone').optional().isString(),
  body('address').optional().isString(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  validateRequest,
];

module.exports = {
  validateVendorIdParam,
  validateCreateVendor,
  validateUpdateVendor,
};

