const { body, param } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

const validateCustomerIdParam = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
  validateRequest,
];

const validateCreateCustomer = [
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('phone').optional().isString(),
  body('address').optional(),
  validateRequest,
];

const validateUpdateCustomer = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('phone').optional().isString(),
  body('address').optional(),
  validateRequest,
];

module.exports = {
  validateCustomerIdParam,
  validateCreateCustomer,
  validateUpdateCustomer,
};

