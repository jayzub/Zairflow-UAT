/**
 * Subscription limit enforcement middleware
 */

const Store = require('../models/store');
const Product = require('../models/products/baseProduct');
const Order = require('../models/order');
const Customer = require('../models/customer');

/**
 * Define plan limits
 */
const PLAN_LIMITS = {
    free: {
        products: 10,
        orders: 50,
        customers: 100,
        admins: 2,
        analytics: false,
        customDomain: false,
        prioritySupport: false
    },
    basic: {
        products: 100,
        orders: 500,
        customers: 1000,
        admins: 5,
        analytics: true,
        customDomain: false,
        prioritySupport: false
    },
    premium: {
        products: 1000,
        orders: 5000,
        customers: 10000,
        admins: 10,
        analytics: true,
        customDomain: true,
        prioritySupport: true
    },
    enterprise: {
        products: -1, // unlimited
        orders: -1,
        customers: -1,
        admins: -1,
        analytics: true,
        customDomain: true,
        prioritySupport: true
    }
};

/**
 * Get current usage for a store
 */
const getStoreUsage = async (storeId) => {
    const [productCount, orderCount, customerCount] = await Promise.all([
        Product.countDocuments({ store: storeId, isActive: true }),
        Order.countDocuments({ store: storeId }),
        Customer.countDocuments({ store: storeId })
    ]);
    
    return {
        products: productCount,
        orders: orderCount,
        customers: customerCount
    };
};

/**
 * Check if store has access to a feature
 */
const hasFeature = (store, feature) => {
    const plan = store.subscription?.plan || 'free';
    const limits = PLAN_LIMITS[plan];
    return limits[feature] === true;
};

/**
 * Check if store is within limits for a resource
 */
const isWithinLimit = async (storeId, resource) => {
    const store = await Store.findById(storeId);
    if (!store) {
        throw new Error('Store not found');
    }
    
    const plan = store.subscription?.plan || 'free';
    const limits = PLAN_LIMITS[plan];
    const limit = limits[resource];
    
    // Unlimited plans
    if (limit === -1) {
        return true;
    }
    
    const usage = await getStoreUsage(storeId);
    return usage[resource] < limit;
};

/**
 * Get remaining capacity for a resource
 */
const getRemainingCapacity = async (storeId, resource) => {
    const store = await Store.findById(storeId);
    if (!store) {
        throw new Error('Store not found');
    }
    
    const plan = store.subscription?.plan || 'free';
    const limits = PLAN_LIMITS[plan];
    const limit = limits[resource];
    
    // Unlimited plans
    if (limit === -1) {
        return -1;
    }
    
    const usage = await getStoreUsage(storeId);
    return Math.max(0, limit - usage[resource]);
};

/**
 * Middleware to check product creation limits
 */
const checkProductLimit = async (req, res, next) => {
    try {
        const storeId = req.params.storeId || req.body.storeId || req.store?._id;
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                error: 'Store ID required'
            });
        }
        
        const isWithin = await isWithinLimit(storeId, 'products');
        if (!isWithin) {
            const remaining = await getRemainingCapacity(storeId, 'products');
            return res.status(403).json({
                success: false,
                error: 'Product limit exceeded for current plan',
                limit: PLAN_LIMITS[req.store?.subscription?.plan || 'free'].products,
                current: (await getStoreUsage(storeId)).products,
                remaining
            });
        }
        
        next();
    } catch (error) {
        console.error('Product limit check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Middleware to check order creation limits
 */
const checkOrderLimit = async (req, res, next) => {
    try {
        const storeId = req.params.storeId || req.body.storeId || req.store?._id;
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                error: 'Store ID required'
            });
        }
        
        const isWithin = await isWithinLimit(storeId, 'orders');
        if (!isWithin) {
            const remaining = await getRemainingCapacity(storeId, 'orders');
            return res.status(403).json({
                success: false,
                error: 'Order limit exceeded for current plan',
                limit: PLAN_LIMITS[req.store?.subscription?.plan || 'free'].orders,
                current: (await getStoreUsage(storeId)).orders,
                remaining
            });
        }
        
        next();
    } catch (error) {
        console.error('Order limit check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Middleware to check customer creation limits
 */
const checkCustomerLimit = async (req, res, next) => {
    try {
        const storeId = req.params.storeId || req.body.storeId || req.store?._id;
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                error: 'Store ID required'
            });
        }
        
        const isWithin = await isWithinLimit(storeId, 'customers');
        if (!isWithin) {
            const remaining = await getRemainingCapacity(storeId, 'customers');
            return res.status(403).json({
                success: false,
                error: 'Customer limit exceeded for current plan',
                limit: PLAN_LIMITS[req.store?.subscription?.plan || 'free'].customers,
                current: (await getStoreUsage(storeId)).customers,
                remaining
            });
        }
        
        next();
    } catch (error) {
        console.error('Customer limit check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Middleware to check admin limit
 */
const checkAdminLimit = async (req, res, next) => {
    try {
        const storeId = req.params.id;
        const store = await Store.findById(storeId);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }
        
        const plan = store.subscription?.plan || 'free';
        const limit = PLAN_LIMITS[plan].admins;
        
        // Unlimited admins
        if (limit === -1) {
            return next();
        }
        
        if (store.admins.length >= limit) {
            return res.status(403).json({
                success: false,
                error: 'Admin limit exceeded for current plan',
                limit,
                current: store.admins.length
            });
        }
        
        next();
    } catch (error) {
        console.error('Admin limit check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Middleware to check feature access
 */
const checkFeatureAccess = (feature) => {
    return async (req, res, next) => {
        try {
            const store = req.store;
            
            if (!store) {
                return res.status(400).json({
                    success: false,
                    error: 'Store context required'
                });
            }
            
            if (!hasFeature(store, feature)) {
                return res.status(403).json({
                    success: false,
                    error: `Feature '${feature}' not available in current plan`,
                    currentPlan: store.subscription?.plan || 'free',
                    requiredPlan: getRequiredPlanForFeature(feature)
                });
            }
            
            next();
        } catch (error) {
            console.error('Feature access check error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};

/**
 * Get required plan for a feature
 */
const getRequiredPlanForFeature = (feature) => {
    for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
        if (limits[feature] === true) {
            return plan;
        }
    }
    return 'enterprise';
};

/**
 * Middleware to check analytics access
 */
const checkAnalyticsAccess = checkFeatureAccess('analytics');

/**
 * Middleware to check custom domain access
 */
const checkCustomDomainAccess = checkFeatureAccess('customDomain');

/**
 * Middleware to check priority support access
 */
const checkPrioritySupportAccess = checkFeatureAccess('prioritySupport');

module.exports = {
    PLAN_LIMITS,
    getStoreUsage,
    hasFeature,
    isWithinLimit,
    getRemainingCapacity,
    checkProductLimit,
    checkOrderLimit,
    checkCustomerLimit,
    checkAdminLimit,
    checkAnalyticsAccess,
    checkCustomDomainAccess,
    checkPrioritySupportAccess,
    checkFeatureAccess
}; 