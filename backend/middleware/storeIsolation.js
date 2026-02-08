const Store = require('../models/store');
const { handleAuthError, handleError } = require('../utils/responseHandler');

function idsEqual(a, b) {
    if (!a || !b) return false;
    const aId = a._id ? a._id : a;
    const bId = b._id ? b._id : b;
    return String(aId) === String(bId);
}

function arrayContainsId(arr, id) {
    if (!Array.isArray(arr) || !id) return false;
    return arr.some((x) => idsEqual(x, id));
}

function getHostWithoutPort(req) {
    const host = (req.get('host') || '').trim();
    // "nike.localhost:3001" -> "nike.localhost"
    return host.split(':')[0];
}

// Deployment/platform hostnames where the first segment is the app name, not a store slug.
// On these hosts we must not treat the first segment as store slug (e.g. yourapp.onrender.com).
const PLATFORM_DOMAINS = [
    'onrender.com',
    'herokuapp.com',
    'vercel.app',
    'netlify.app',
    'railway.app',
    'fly.dev',
    'azurewebsites.net',
    'cloud.run',
    'run.app'
];

function isPlatformHost(hostNoPort) {
    if (!hostNoPort) return false;
    const lower = hostNoPort.toLowerCase();
    return PLATFORM_DOMAINS.some((d) => lower === d || lower.endsWith('.' + d));
}

/**
 * Build store-scoped URLs for views (home, products).
 * On platform domains (Render, Heroku, etc.) use same-origin + query; on subdomain hosts use full subdomain URL.
 */
function buildStoreUrls(req, store) {
    if (!store || !store.slug) return {};
    const host = (req.get('host') || '').trim();
    const hostNoPort = host.split(':')[0];
    const protocol = req.protocol || 'https';

    if (isPlatformHost(hostNoPort)) {
        return {
            storeHomepageUrl: `/home?storeSlug=${store.slug}`,
            storeProductsUrl: `/api/products?storeSlug=${store.slug}`
        };
    }

    const parts = hostNoPort.split('.').filter(Boolean);
    const port = host.includes(':') ? host.split(':')[1] : '';
    const parentHost = parts.length >= 2
        ? parts.slice(1).join('.') + (port ? ':' + port : '')
        : host;
    const base = `${protocol}://${store.slug}.${parentHost}`;
    return {
        storeHomepageUrl: `${base}/home`,
        storeProductsUrl: `${base}/api/products`
    };
}

function getStoreSlugFromHost(req) {
    const hostNoPort = getHostWithoutPort(req);
    if (!hostNoPort) return null;

    const parts = hostNoPort.split('.').filter(Boolean);

    // For local dev: "<storeslug>.localhost"
    if (parts.length === 2 && parts[1].toLowerCase() === 'localhost') {
        return parts[0].toLowerCase();
    }

    // Deployment URLs (e.g. yourapp.onrender.com): first segment is app name, not store slug.
    if (parts.length >= 3 && isPlatformHost(hostNoPort)) {
        return null;
    }

    // For real domains: "<storeslug>.<domain>.<tld>" (or deeper)
    if (parts.length >= 3) {
        return parts[0].toLowerCase();
    }

    // Root domain like "yourdomain.com" (2 parts) or "localhost" (1 part) => no store slug.
    return null;
}

function isReservedSubdomain(slug) {
    if (!slug) return false;
    return ['www', 'api'].includes(String(slug).toLowerCase());
}

function hasExplicitStoreHint(req) {
    const hostSlug = getStoreSlugFromHost(req);
    return Boolean(
        req.headers['x-store-slug'] ||
        req.query?.storeSlug ||
        req.params?.storeSlug ||
        (hostSlug && !isReservedSubdomain(hostSlug))
    );
}

/**
 * Middleware to extract store information from request
 * Can be used with subdomain routing or custom headers
 */
const extractStore = async (req, res, next) => {
    try {
        let store = null;
        
        // Method 1: Extract from subdomain
        const subdomain = getStoreSlugFromHost(req);
        
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
            return handleAuthError(
                req,
                res,
                'Store not found or inactive. Please specify a store or ensure you have access to a store.',
                404
            );
        }
        
        req.store = store;
        // Make store available to server-rendered views
        res.locals.store = store;
        res.locals.storeSlug = store?.slug;
        const urls = buildStoreUrls(req, store);
        if (urls.storeHomepageUrl) res.locals.storeHomepageUrlFromServer = urls.storeHomepageUrl;
        if (urls.storeProductsUrl) res.locals.storeProductsUrlFromServer = urls.storeProductsUrl;
        next();
    } catch (error) {
        console.error('Store extraction error:', error);
        return handleError(req, res, 'Internal server error', 500);
    }
};

/**
 * Optional store extraction:
 * - If the request includes a store hint (subdomain/header/query/path), resolve `req.store`.
 * - Otherwise, continue without a store (keeps marketplace / platform routes working).
 */
const extractStoreOptional = async (req, res, next) => {
    if (!hasExplicitStoreHint(req)) {
        req.store = req.store || null;
        return next();
    }
    return extractStore(req, res, next);
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
            if (idsEqual(req.store.owner, req.user._id)) {
                return next();
            }
            
            // Check if user is store admin
            if (accessLevel === 'admin' && arrayContainsId(req.store.admins, req.user._id)) {
                return next();
            }
            
            // Check if user has any role in this store
            if (accessLevel === 'any' && 
                (arrayContainsId(req.user.ownedStores, req.store._id) || 
                 arrayContainsId(req.user.adminStores, req.store._id))) {
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
 * Middleware to ensure store-specific data access
 */
const ensureStoreDataAccess = (modelName) => {
    return async (req, res, next) => {
        try {
            if (!req.store && !req.user?.isPlatformAdmin) {
                return handleError(req, res, 'Store context required', 400);
            }
            
            // Add store filter to req for use in controllers
            if (req.store) {
                req.storeFilter = { store: req.store._id };
            }
            
            next();
        } catch (error) {
            console.error('Store data access error:', error);
            return handleError(req, res, 'Internal server error', 500);
        }
    };
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
                success: false,
                message: 'Product limit exceeded for current plan',
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
    extractStoreOptional,
    requireStoreAccess,
    addStoreFilter,
    ensureStoreDataAccess,
    checkStoreLimits
}; 