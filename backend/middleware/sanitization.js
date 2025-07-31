/**
 * XSS protection and input sanitization middleware
 */

const xss = require('xss');

/**
 * Sanitize store data to prevent XSS attacks
 */
const sanitizeStoreData = (data) => {
    if (!data) return data;
    
    const sanitized = {};
    
    // Sanitize string fields
    if (data.name) sanitized.name = xss(data.name.trim());
    if (data.description) sanitized.description = xss(data.description.trim());
    
    // Sanitize contact info
    if (data.contactInfo) {
        sanitized.contactInfo = {};
        if (data.contactInfo.email) sanitized.contactInfo.email = xss(data.contactInfo.email.trim());
        if (data.contactInfo.phone) sanitized.contactInfo.phone = xss(data.contactInfo.phone.trim());
        
        if (data.contactInfo.address) {
            sanitized.contactInfo.address = {};
            if (data.contactInfo.address.street) sanitized.contactInfo.address.street = xss(data.contactInfo.address.street.trim());
            if (data.contactInfo.address.city) sanitized.contactInfo.address.city = xss(data.contactInfo.address.city.trim());
            if (data.contactInfo.address.state) sanitized.contactInfo.address.state = xss(data.contactInfo.address.state.trim());
            if (data.contactInfo.address.zipCode) sanitized.contactInfo.address.zipCode = xss(data.contactInfo.address.zipCode.trim());
            if (data.contactInfo.address.country) sanitized.contactInfo.address.country = xss(data.contactInfo.address.country.trim());
        }
    }
    
    // Sanitize settings (only string fields)
    if (data.settings) {
        sanitized.settings = { ...data.settings };
        if (data.settings.currency) sanitized.settings.currency = xss(data.settings.currency.trim());
        if (data.settings.timezone) sanitized.settings.timezone = xss(data.settings.timezone.trim());
        if (data.settings.language) sanitized.settings.language = xss(data.settings.language.trim());
    }
    
    // Sanitize theme
    if (data.theme) {
        sanitized.theme = { ...data.theme };
        if (data.theme.primaryColor) sanitized.theme.primaryColor = xss(data.theme.primaryColor.trim());
        if (data.theme.secondaryColor) sanitized.theme.secondaryColor = xss(data.theme.secondaryColor.trim());
        if (data.theme.fontFamily) sanitized.theme.fontFamily = xss(data.theme.fontFamily.trim());
    }
    
    return sanitized;
};

/**
 * Sanitize admin email
 */
const sanitizeAdminEmail = (email) => {
    return xss(email.trim().toLowerCase());
};

/**
 * Sanitize search terms
 */
const sanitizeSearchTerm = (term) => {
    return xss(term.trim());
};

/**
 * Middleware to sanitize store creation data
 */
const sanitizeStoreCreation = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeStoreData(req.body);
    }
    next();
};

/**
 * Middleware to sanitize store update data
 */
const sanitizeStoreUpdate = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeStoreData(req.body);
    }
    next();
};

/**
 * Middleware to sanitize admin email
 */
const sanitizeAdminEmailMiddleware = (req, res, next) => {
    if (req.body && req.body.email) {
        req.body.email = sanitizeAdminEmail(req.body.email);
    }
    next();
};

/**
 * Middleware to sanitize search queries
 */
const sanitizeSearchQuery = (req, res, next) => {
    if (req.query.search) {
        req.query.search = sanitizeSearchTerm(req.query.search);
    }
    next();
};

/**
 * Sanitize all string inputs in request body
 */
const sanitizeRequestBody = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = xss(value.trim());
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};

module.exports = {
    sanitizeStoreData,
    sanitizeAdminEmail,
    sanitizeSearchTerm,
    sanitizeStoreCreation,
    sanitizeStoreUpdate,
    sanitizeAdminEmailMiddleware,
    sanitizeSearchQuery,
    sanitizeRequestBody,
    sanitizeObject
}; 