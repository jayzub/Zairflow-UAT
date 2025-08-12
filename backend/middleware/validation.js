/**
 * Validation middleware for store operations
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validate store creation request
 */
const validateStoreCreation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Store name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage('Store name contains invalid characters'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('contactInfo.email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('contactInfo.phone')
        .optional()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Invalid phone number format'),
    body('contactInfo.address.street')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Street address too long'),
    body('contactInfo.address.city')
        .optional()
        .isLength({ max: 100 })
        .withMessage('City name too long'),
    body('contactInfo.address.state')
        .optional()
        .isLength({ max: 50 })
        .withMessage('State name too long'),
    body('contactInfo.address.zipCode')
        .optional()
        .matches(/^[0-9A-Za-z\s\-]{3,10}$/)
        .withMessage('Invalid zip code format'),
    body('contactInfo.address.country')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Country name too long'),
    body('settings.currency')
        .optional()
        .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
        .withMessage('Invalid currency code'),
    body('settings.timezone')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Timezone too long'),
    body('settings.language')
        .optional()
        .isIn(['en', 'es', 'fr', 'de', 'it', 'pt'])
        .withMessage('Invalid language code'),
    body('settings.taxRate')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Tax rate must be between 0 and 100'),
    body('settings.shippingEnabled')
        .optional()
        .isBoolean()
        .withMessage('Shipping enabled must be true or false'),
    body('settings.reviewsEnabled')
        .optional()
        .isBoolean()
        .withMessage('Reviews enabled must be true or false'),
    body('settings.socialLoginEnabled')
        .optional()
        .isBoolean()
        .withMessage('Social login enabled must be true or false'),
    body('theme.primaryColor')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Primary color must be a valid hex color'),
    body('theme.secondaryColor')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Secondary color must be a valid hex color'),
    body('theme.fontFamily')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Font family too long'),
    validateRequest
];

/**
 * Validate store update request
 */
const validateStoreUpdate = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID format'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Store name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage('Store name contains invalid characters'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('contactInfo.email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('contactInfo.phone')
        .optional()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Invalid phone number format'),
    body('settings.taxRate')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Tax rate must be between 0 and 100'),
    body('theme.primaryColor')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Primary color must be a valid hex color'),
    body('theme.secondaryColor')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Secondary color must be a valid hex color'),
    validateRequest
];

/**
 * Validate store ID parameter
 */
const validateStoreId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID format'),
    validateRequest
];

/**
 * Validate store discovery query parameters
 */
const validateStoreDiscovery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('search')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Search term too long'),
    query('category')
        .optional()
        .isIn(['free', 'basic', 'premium', 'enterprise'])
        .withMessage('Invalid category'),
    validateRequest
];

/**
 * Validate admin management
 */
const validateAddAdmin = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID format'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    validateRequest
];

const validateRemoveAdmin = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID format'),
    body('userId')
        .isMongoId()
        .withMessage('Invalid user ID format'),
    validateRequest
];

/**
 * Validate store settings update
 */
const validateStoreSettings = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID format'),
    body('settings.currency')
        .optional()
        .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
        .withMessage('Invalid currency code'),
    body('settings.taxRate')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Tax rate must be between 0 and 100'),
    body('settings.shippingEnabled')
        .optional()
        .isBoolean()
        .withMessage('Shipping enabled must be true or false'),
    body('settings.reviewsEnabled')
        .optional()
        .isBoolean()
        .withMessage('Reviews enabled must be true or false'),
    body('contactInfo.email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    validateRequest
];

/**
 * Validate store theme update
 */
const validateStoreTheme = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID format'),
    body('theme.primaryColor')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Primary color must be a valid hex color'),
    body('theme.secondaryColor')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Secondary color must be a valid hex color'),
    body('theme.fontFamily')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Font family too long'),
    validateRequest
];

/**
 * Generic validation result handler
 */
function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
}

module.exports = {
    validateStoreCreation,
    validateStoreUpdate,
    validateStoreId,
    validateStoreDiscovery,
    validateAddAdmin,
    validateRemoveAdmin,
    validateStoreSettings,
    validateStoreTheme,
    validateRequest
}; 