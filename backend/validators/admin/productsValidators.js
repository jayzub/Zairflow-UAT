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

const validateBulkImport = [
  body('store').optional().isMongoId().withMessage('Invalid store ID'),
  (req, res, next) => {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required. Please upload a .csv file.',
      });
    }
    const ext = (req.file.originalname || '').toLowerCase();
    if (!ext.endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only CSV files are allowed.',
      });
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    next();
  },
  validateRequest,
];

module.exports = {
  validateProductIdParam,
  validateFeaturedCountParam,
  validateCreateProduct,
  validateUpdateProduct,
  validateProductsListQuery,
  validateBulkImport,
};

