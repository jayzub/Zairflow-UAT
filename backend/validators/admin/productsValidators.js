const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');
const { MAX_CSV_IMPORT_SIZE_BYTES, MAX_CSV_IMPORT_ROWS } = require('../../config/importLimits');

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
  query('filter').optional().isIn(['all', 'published', 'drafts', 'discount', 'featured']).withMessage('filter must be all, published, drafts, discount, or featured'),
  query('categories').optional().isString(),
  query('vendor').optional().isMongoId().withMessage('vendor must be a valid ID'),
  query('minPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('minPrice must be a non-negative number'),
  query('maxPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('maxPrice must be a non-negative number'),
  query('productType').optional().isString(),
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
    if (req.file.size > MAX_CSV_IMPORT_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_CSV_IMPORT_SIZE_BYTES / (1024 * 1024)}MB.`,
      });
    }
    // Enforce max row count (approximate: count lines minus header)
    const text = req.file.buffer.toString('utf8');
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const dataRows = Math.max(0, lines.length - 1);
    if (dataRows > MAX_CSV_IMPORT_ROWS) {
      return res.status(400).json({
        success: false,
        message: `Too many rows. Maximum is ${MAX_CSV_IMPORT_ROWS} data rows (file has ${dataRows}).`,
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

