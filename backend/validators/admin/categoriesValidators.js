const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

const validateCategoryIdParam = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  validateRequest,
];

const validateCreateCategory = [
  body('name').isString().withMessage('Category name is required').notEmpty().withMessage('Category name is required'),
  body('slug').optional().isString(),
  body('description').optional().isString(),
  body('parent').optional({ nullable: true }).isMongoId().withMessage('Invalid parent category ID'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('displayOrder must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('allowedProductTypes').optional(),
  validateRequest,
];

const validateUpdateCategory = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('parent').optional({ nullable: true }).isMongoId().withMessage('Invalid parent category ID'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('displayOrder must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  validateRequest,
];

const validateCompatibleCategoriesQuery = [
  query('productType').notEmpty().withMessage('Product type is required'),
  validateRequest,
];

module.exports = {
  validateCategoryIdParam,
  validateCreateCategory,
  validateUpdateCategory,
  validateCompatibleCategoriesQuery,
};

