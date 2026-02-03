const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Customer = require('../models/customer');
const { handleAuthError } = require('../utils/responseHandler');

// Middleware to verify JWT token and attach user/customer to request
const verifyToken = (req, res, next) => {
    // Check header first, then cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
        return handleAuthError(req, res, 'Access token required');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type === 'customer') {
            req.customer = { _id: decoded.id, email: decoded.email };
        } else {
            // Handle both 'id' and 'userID' field names for backward compatibility
            const userId = decoded.id || decoded.userID;
            req.user = { _id: userId, email: decoded.email };
        }
        
        next();
    } catch (error) {
        return handleAuthError(req, res, 'Invalid token');
    }
};

// Middleware to require admin authentication
const requireAuth = async (req, res, next) => {
    try {
        // Check header first, then cookies
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        
        if (!token) {
            return handleAuthError(req, res, 'Access token required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Handle both 'id' and 'userID' field names for backward compatibility
        const userId = decoded.id || decoded.userID;
        
        if (!userId) {
            return handleAuthError(req, res, 'Invalid token format');
        }

        // Find the user in database
        const user = await User.findById(userId);
        if (!user || !user.isActive) {
            return handleAuthError(req, res, 'User not found or inactive');
        }

        req.user = user;
        next();
    } catch (error) {
        return handleAuthError(req, res, 'Authentication failed');
    }
};

// Middleware to require customer authentication
const requireCustomerAuth = async (req, res, next) => {
    try {
        // Check header first, then cookies
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        
        if (!token) {
            return handleAuthError(req, res, 'Access token required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'customer') {
            return handleAuthError(req, res, 'Customer token required');
        }

        // Find the customer in database
        const customer = await Customer.findById(decoded.id);
        if (!customer || !customer.isActive) {
            return handleAuthError(req, res, 'Customer not found or inactive');
        }

        req.customer = customer;
        next();
    } catch (error) {
        return handleAuthError(req, res, 'Authentication failed');
    }
};

// Optional customer auth: if a valid customer token is present, set req.customer (for navbar, etc.); otherwise continue without error
const optionalCustomerAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.customerToken || req.cookies?.token;
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'customer' || !decoded.id) return next();

        const customer = await Customer.findById(decoded.id);
        if (customer && customer.isActive) req.customer = customer;
        next();
    } catch {
        next();
    }
};

// Legacy middleware for backward compatibility
function authJwt() {
    return (req, res, next) => {
        // Skip authentication for public routes
        const publicPaths = [
            /\/public\/uploads(.*)/,
            /\/api\/v1\/products(.*)/,
            /\/api\/v1\/categories(.*)/,
            /\/api\/v1\/stores\/discover(.*)/,
            /\/api\/v1\/customers\/register/,
            /\/api\/v1\/customers\/login/
        ];

        const isPublicPath = publicPaths.some(path => 
            path.test(req.path) && (req.method === 'GET' || req.method === 'POST')
        );

        if (isPublicPath) {
            return next();
        }

        // For protected routes, use the new authentication
        return requireAuth(req, res, next);
    };
}

module.exports = {
    authJwt,
    requireAuth,
    requireCustomerAuth,
    optionalCustomerAuth,
    verifyToken
};
