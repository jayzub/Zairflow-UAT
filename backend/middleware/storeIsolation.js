const Store = require('../models/store');
const { handleAuthError, handleError } = require('../utils/responseHandler');

/**
 * Middleware to extract store information from request
 * Can be used with subdomain routing or custom headers
 */
const extractStore = async (req, res, next) => {
    try {
        let store = null;
        
        // Method 1: Extract from subdomain
        const host = req.get('host');
        const subdomain = host.split('.')[0];
        
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
            store = await Store.findOne({ 
                slug: subdomain, 
                isActive: true 
            }).populate('owner', 'name email');
        }
        
        // Method 2: Extract from custom header
        if (!store && req.headers['x-store-slug']) {
            store = await Store.findOne({ 
                slug: req.headers['x-store-slug'], 
                isActive: true 
            }).populate('owner', 'name email');
        }
        
        // Method 3: Extract from query parameter (for API calls)
        if (!store && req.query.storeSlug) {
            store = await Store.findOne({ 
                slug: req.query.storeSlug, 
                isActive: true 
            }).populate('owner', 'name email');
        }
        
        // Method 4: Extract from path parameter
        if (!store && req.params.storeSlug) {
            store = await Store.findOne({ 
                slug: req.params.storeSlug, 
                isActive: true 
            }).populate('owner', 'name email');
        }
        
        // Method 5: For authenticated users without store context, try to find their default store
        if (!store && req.user) {
            // Platform admins can work without store context
            if (req.user.isPlatformAdmin) {
                // Allow platform admins to proceed without store context
                req.store = null;
                return next();
            }
            
            // For store owners/admins, try to find their default store
            if (req.user.ownedStores && req.user.ownedStores.length > 0) {
                store = await Store.findOne({ 
                    _id: req.user.ownedStores[0], 
                    isActive: true 
                }).populate('owner', 'name email');
            } else if (req.user.adminStores && req.user.adminStores.length > 0) {
                store = await Store.findOne({ 
                    _id: req.user.adminStores[0], 
                    isActive: true 
                }).populate('owner', 'name email');
            }
        }
        
        // If still no store found, but user is platform admin, allow access
        if (!store && req.user && req.user.isPlatformAdmin) {
            req.store = null;
            return next();
        }
        
        // If no store found and user is not platform admin, return error
        if (!store) {
            return handleError(req, res, 'Store not found or inactive. Please specify a store or ensure you have access to a store.', 404);
        }
        
        req.store = store;
        next();
    } catch (error) {
        console.error('Store extraction error:', error);
        return handleError(req, res, 'Internal server error', 500);
    }
};

/**
 * Middleware to ensure user has access to the store
 */
const requireStoreAccess = (accessLevel = 'admin') => {
    return async (req, res, next) => {
        try {
            // Platform admins have access to all stores (even when req.store is null)
            if (req.user && req.user.isPlatformAdmin) {
                return next();
            }
            
            if (!req.store) {
                return handleError(req, res, 'Store not found', 400);
            }
            
            if (!req.user) {
                return handleAuthError(req, res, 'Authentication required', 401);
            }
            
            // Check if user is store owner
            if (req.store.owner._id.toString() === req.user._id.toString()) {
                return next();
            }
            
            // Check if user is store admin
            if (accessLevel === 'admin' && req.store.admins.includes(req.user._id)) {
                return next();
            }
            
            // Check if user has any role in this store
            if (accessLevel === 'any' && 
                (req.user.ownedStores.includes(req.store._id) || 
                 req.user.adminStores.includes(req.store._id))) {
                return next();
            }
            
            return handleAuthError(req, res, 'Access denied', 403);
        } catch (error) {
            console.error('Store access check error:', error);
            return handleError(req, res, 'Internal server error', 500);
        }
    };
};

/**
 * Middleware to add store filter to queries
 */
const addStoreFilter = (req, res, next) => {
    if (req.store) {
        req.storeFilter = { store: req.store._id };
    }
    next();
};

/**
 * Middleware to validate store subscription limits
 */
const checkStoreLimits = async (req, res, next) => {
    try {
        if (!req.store) {
            return next();
        }
        
        const store = req.store;
        const plan = store.subscription.plan;
        
        // Define limits based on plan
        const limits = {
            free: { products: 10, orders: 50, customers: 100 },
            basic: { products: 100, orders: 500, customers: 1000 },
            premium: { products: 1000, orders: 5000, customers: 10000 },
            enterprise: { products: -1, orders: -1, customers: -1 } // Unlimited
        };
        
        const currentLimits = limits[plan] || limits.free;
        
        // Check if any limits are exceeded
        if (currentLimits.products !== -1 && store.analytics.totalProducts >= currentLimits.products) {
            return res.status(403).json({ 
                error: 'Product limit exceeded for current plan',
                limit: currentLimits.products,
                current: store.analytics.totalProducts
            });
        }
        
        req.storeLimits = currentLimits;
        next();
    } catch (error) {
        console.error('Store limits check error:', error);
        next();
    }
};

module.exports = {
    extractStore,
    requireStoreAccess,
    addStoreFilter,
    checkStoreLimits
}; 