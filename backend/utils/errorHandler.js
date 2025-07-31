/**
 * Comprehensive error handling utility
 */

/**
 * Handle different types of errors and return appropriate responses
 */
const handleError = (error, req, res) => {
    console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        user: req.user?._id
    });

    // MongoDB/Mongoose errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: Object.values(error.errors).map(e => ({
                field: e.path,
                message: e.message,
                value: e.value
            }))
        });
    }

    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format',
            details: {
                field: error.path,
                value: error.value
            }
        });
    }

    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
            success: false,
            error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
            details: {
                field,
                value: error.keyValue[field]
            }
        });
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired'
        });
    }

    // Rate limiting errors
    if (error.status === 429) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests',
            retryAfter: error.headers?.['retry-after']
        });
    }

    // File upload errors
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            error: 'File too large',
            details: {
                maxSize: error.limit,
                actualSize: error.size
            }
        });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            error: 'Unexpected file field'
        });
    }

    // Cloudinary errors
    if (error.http_code) {
        return res.status(error.http_code).json({
            success: false,
            error: 'File upload failed',
            details: error.message
        });
    }

    // Network errors
    if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable'
        });
    }

    if (error.code === 'ETIMEDOUT') {
        return res.status(504).json({
            success: false,
            error: 'Request timeout'
        });
    }

    // Custom business logic errors
    if (error.isBusinessError) {
        return res.status(error.statusCode || 400).json({
            success: false,
            error: error.message,
            details: error.details
        });
    }

    // Default error
    return res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message
    });
};

/**
 * Create custom business errors
 */
class BusinessError extends Error {
    constructor(message, statusCode = 400, details = null) {
        super(message);
        this.name = 'BusinessError';
        this.isBusinessError = true;
        this.statusCode = statusCode;
        this.details = details;
    }
}

class ValidationError extends BusinessError {
    constructor(message, details = null) {
        super(message, 400, details);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends BusinessError {
    constructor(message = 'Authentication required') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends BusinessError {
    constructor(message = 'Access denied') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends BusinessError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends BusinessError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

class RateLimitError extends BusinessError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}

/**
 * Async error wrapper
 */
const asyncErrorHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(error => {
            handleError(error, req, res);
        });
    };
};

/**
 * Validate required fields
 */
const validateRequired = (data, fields) => {
    const missing = [];
    
    for (const field of fields) {
        if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
            missing.push(field);
        }
    }
    
    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(', ')}`, {
            missingFields: missing
        });
    }
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
    }
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) {
        throw new ValidationError('Invalid ID format');
    }
};

/**
 * Sanitize error for logging
 */
const sanitizeErrorForLogging = (error) => {
    const sanitized = {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
    };

    // Remove sensitive information
    if (error.keyValue) {
        sanitized.keyValue = {};
        Object.keys(error.keyValue).forEach(key => {
            if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
                sanitized.keyValue[key] = '[REDACTED]';
            } else {
                sanitized.keyValue[key] = error.keyValue[key];
            }
        });
    }

    return sanitized;
};

module.exports = {
    handleError,
    asyncErrorHandler,
    validateRequired,
    validateEmail,
    validateObjectId,
    sanitizeErrorForLogging,
    BusinessError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError
}; 