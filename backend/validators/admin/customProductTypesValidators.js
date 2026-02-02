const { body, param } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

const validateCustomProductTypeIdParam = [
  param('id').isMongoId().withMessage('Invalid custom product type ID'),
  validateRequest,
];

const validateCreateCustomProductType = [
  body('name').isString().withMessage('Name is required').notEmpty().withMessage('Name is required'),
  body('displayName').isString().withMessage('Display name is required').notEmpty().withMessage('Display name is required'),
  body('description').optional().isString(),
  body('icon').optional().isString(),
  body('color').optional().isString(),
  body('fields').optional().isObject().withMessage('Fields must be an object'),
  body('variantFields').optional().isArray().withMessage('variantFields must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  validateRequest,
];

const validateUpdateCustomProductType = [
  param('id').isMongoId().withMessage('Invalid custom product type ID'),
  body('displayName').optional().isString(),
  body('description').optional().isString(),
  body('icon').optional().isString(),
  body('color').optional().isString(),
  body('fields').optional().isObject().withMessage('Fields must be an object'),
  body('variantFields').optional().isArray().withMessage('variantFields must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  validateRequest,
];

module.exports = {
  validateCustomProductTypeIdParam,
  validateCreateCustomProductType,
  validateUpdateCustomProductType,
};

