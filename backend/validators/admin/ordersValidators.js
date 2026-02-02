const { body, param } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

const validateOrderIdParam = [
  param('id').isMongoId().withMessage('Invalid order ID'),
  validateRequest,
];

const validateUpdateOrderStatus = [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').isString().withMessage('status is required').notEmpty().withMessage('status is required'),
  validateRequest,
];

const validateProcessRefund = [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('refundAmount')
    .isFloat({ min: 0 })
    .withMessage('refundAmount must be a non-negative number')
    .toFloat(),
  body('reason').optional().isString(),
  validateRequest,
];

module.exports = {
  validateOrderIdParam,
  validateUpdateOrderStatus,
  validateProcessRefund,
};

