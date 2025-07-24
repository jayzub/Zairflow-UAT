const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Customer = require('../models/customer');

// Middleware to verify JWT token and attach user/customer to request
const verifyToken = (req, res, next) => {
    // Check header first, then cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
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
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to require admin authentication
const requireAuth = async (req, res, next) => {
    try {
        // Check header first, then cookies
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Handle both 'id' and 'userID' field names for backward compatibility
        const userId = decoded.id || decoded.userID;
        
        if (!userId) {
            return res.status(401).json({ error: 'Invalid token format' });
        }

        // Find the user in database
        const user = await User.findById(userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

// Middleware to require customer authentication
const requireCustomerAuth = async (req, res, next) => {
    try {
        // Check header first, then cookies
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'customer') {
            return res.status(401).json({ error: 'Customer token required' });
        }

        // Find the customer in database
        const customer = await Customer.findById(decoded.id);
        if (!customer || !customer.isActive) {
            return res.status(401).json({ error: 'Customer not found or inactive' });
        }

        req.customer = customer;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
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
    verifyToken
};
