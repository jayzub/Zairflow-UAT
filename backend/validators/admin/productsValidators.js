const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

const validateProductIdParam = [
  param('id').isMongoId().withMessage('Invalid Product ID'),
  validateRequest,
];

const validateFeaturedCountParam = [
  param('count').optional().isInt({ min: 0, max: 100 }).withMessage('Invalid count'),
  validateRequest,
];

const validateCreateProduct = [
  body('productType').notEmpty().withMessage('Product type is required'),
  body('name').optional().isString().withMessage('name must be a string'),
  body('description').optional().isString().withMessage('description must be a string'),
  body('vendor').optional().isMongoId().withMessage('Invalid vendor ID'),
  // category can be a string (single) or array; service will parse JSON strings too
  body('category').optional(),
  body('tags').optional(),
  validateRequest,
];

const validateUpdateProduct = [
  param('id').isMongoId().withMessage('Invalid Product ID'),
  body('name').optional().isString().withMessage('name must be a string'),
  body('description').optional().isString().withMessage('description must be a string'),
  body('vendor').optional().isMongoId().withMessage('Invalid vendor ID'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be boolean'),
  validateRequest,
];

const validateProductsListQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be between 1 and 200'),
  query('sort').optional().isString(),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
  validateRequest,
];

module.exports = {
  validateProductIdParam,
  validateFeaturedCountParam,
  validateCreateProduct,
  validateUpdateProduct,
  validateProductsListQuery,
};

