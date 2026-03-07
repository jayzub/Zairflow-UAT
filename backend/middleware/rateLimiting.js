/**
 * Rate limiting middleware for store operations and admin auth
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limit for admin login (brute-force protection).
 * 10 attempts per 15 minutes per IP; no auth yet so key is IP only.
 */
const adminLoginLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown'
});

/**
 * Rate limit for admin register (abuse protection).
 * 5 attempts per 15 minutes per IP.
 */
const adminRegisterLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again in 15 minutes.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown'
});

/**
 * Rate limit for admin forgot-password (abuse protection).
 * 3 attempts per 15 minutes per IP.
 */
const adminForgotPasswordLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Too many reset requests. Please try again in 15 minutes.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown'
});

/**
 * Rate limit for store creation (5 stores per 15 minutes per IP)
 */
const storeCreationLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 store creations per windowMs
    message: {
        success: false,
        error: 'Too many store creation attempts, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise use IP
        return req.user ? req.user._id.toString() : req.ip;
    },
    skip: (req) => {
        // Skip rate limiting for platform admins
        return req.user && req.user.isPlatformAdmin;
    }
});

/**
 * Rate limit for store updates (20 updates per hour per user)
 */
const storeUpdateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each user to 20 store updates per hour
    message: {
        success: false,
        error: 'Too many store update attempts, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user._id.toString(),
    skip: (req) => req.user && req.user.isPlatformAdmin
});

/**
 * Rate limit for store discovery (100 requests per minute per IP)
 */
const storeDiscoveryLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 discovery requests per minute
    message: {
        success: false,
        error: 'Too many discovery requests, please try again later',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limit for admin operations (10 operations per hour per user)
 */
const adminOperationLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each user to 10 admin operations per hour
    message: {
        success: false,
        error: 'Too many admin operations, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user._id.toString(),
    skip: (req) => req.user && req.user.isPlatformAdmin
});

/**
 * Rate limit for analytics requests (30 requests per hour per user)
 */
const analyticsLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // limit each user to 30 analytics requests per hour
    message: {
        success: false,
        error: 'Too many analytics requests, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user._id.toString(),
    skip: (req) => req.user && req.user.isPlatformAdmin
});

/**
 * Rate limit for settings updates (15 updates per hour per user)
 */
const settingsUpdateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // limit each user to 15 settings updates per hour
    message: {
        success: false,
        error: 'Too many settings update attempts, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user._id.toString(),
    skip: (req) => req.user && req.user.isPlatformAdmin
});

/**
 * Rate limit for theme updates (10 updates per hour per user)
 */
const themeUpdateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each user to 10 theme updates per hour
    message: {
        success: false,
        error: 'Too many theme update attempts, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user._id.toString(),
    skip: (req) => req.user && req.user.isPlatformAdmin
});

/**
 * Rate limit for general API requests (1000 requests per hour per user)
 */
const generalApiLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // limit each user to 1000 API requests per hour
    message: {
        success: false,
        error: 'Too many API requests, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip,
    skip: (req) => req.user && req.user.isPlatformAdmin
});

module.exports = {
    adminLoginLimit,
    adminRegisterLimit,
    adminForgotPasswordLimit,
    storeCreationLimit,
    storeUpdateLimit,
    storeDiscoveryLimit,
    adminOperationLimit,
    analyticsLimit,
    settingsUpdateLimit,
    themeUpdateLimit,
    generalApiLimit
}; 