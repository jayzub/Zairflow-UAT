const Store = require('../models/store');
const User = require('../models/user');
const Customer = require('../models/customer');
const Product = require('../models/products/baseProduct');
const Category = require('../models/category');
const Order = require('../models/order');
const { asyncHandler } = require('../middleware/asyncHandler');
const storeCache = require('../utils/cache');

/**
 * Create a new store
 */
const createStore = asyncHandler(async (req, res) => {
    const { name, description, contactInfo, settings, theme } = req.body;
    
    if (!req.user || !req.user._id) {
        return res.status(401).json({
            success: false,
            error: 'User not authenticated or user ID missing',
            debug: {
                hasUser: !!req.user,
                userType: typeof req.user,
                userId: req.user?._id
            }
        });
    }
    
    try {
        // Generate unique slug
        let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        let counter = 1;
        let originalSlug = slug;
        
        while (await Store.findOne({ slug })) {
            slug = `${originalSlug}-${counter}`;
            counter++;
        }
        
        const store = new Store({
            name,
            slug,
            description,
            owner: req.user._id,
            contactInfo: {
                email: contactInfo?.email || req.user.email,
                phone: contactInfo?.phone,
                address: contactInfo?.address
            },
            settings: settings || {},
            theme: theme || {}
        });
        
        await store.save();
        
        // Update user's owned stores
        await User.findByIdAndUpdate(req.user._id, {
            $push: { ownedStores: store._id },
            $set: { role: 'store_owner' }
        });
        
        // Invalidate user stores cache
        await storeCache.invalidateUserStores(req.user._id);
        
        res.status(201).json({
            success: true,
            data: store
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'Store with this name already exists'
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        
        console.error('Store creation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get all stores for a user (owned or admin)
 */
const getUserStores = asyncHandler(async (req, res) => {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
        return res.status(401).json({
            success: false,
            error: 'User not authenticated'
        });
    }
    
    try {
        // Try to get from cache first
        const cached = await storeCache.getUserStores(req.user._id);
        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }
        
        // Optimize with aggregation to avoid N+1 queries
        const stores = await Store.aggregate([
            {
                $match: {
                    $or: [
                        { owner: req.user._id },
                        { admins: req.user._id }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            {
                $unwind: '$owner'
            },
            {
                $project: {
                    'owner.password': 0,
                    'owner.__v': 0
                }
            }
        ]);
        
        // Cache the result
        await storeCache.setUserStores(req.user._id, stores);
        
        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        console.error('Get user stores error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get store details
 */
const getStore = asyncHandler(async (req, res) => {
    try {
        // Try to get from cache first
        const cached = await storeCache.getStore(req.params.id);
        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }
        
        const store = await Store.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('admins', 'name email');
        
        if (!store) {
            return res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }
        
        // Cache the result
        await storeCache.setStore(req.params.id, store);
        
        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid store ID format'
            });
        }
        
        console.error('Get store error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Update store
 */
const updateStore = asyncHandler(async (req, res) => {
    const { name, description, contactInfo, settings, theme } = req.body;
    
    try {
        const store = await Store.findById(req.params.id);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }
        
        // Check if user has permission to update
        if (store.owner.toString() !== req.user._id.toString() && 
            !store.admins.includes(req.user._id) && 
            !req.user.isPlatformAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        // Update fields
        if (name) store.name = name;
        if (description !== undefined) store.description = description;
        if (contactInfo) store.contactInfo = { ...store.contactInfo, ...contactInfo };
        if (settings) store.settings = { ...store.settings, ...settings };
        if (theme) store.theme = { ...store.theme, ...theme };
        
        await store.save();
        
        // Invalidate cache
        await storeCache.invalidateAllStoreCache(store._id);
        await storeCache.invalidateUserStores(req.user._id);
        
        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid store ID format'
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        
        console.error('Update store error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get store analytics
 */
const getStoreAnalytics = asyncHandler(async (req, res) => {
    const storeId = req.params.id;
    
    try {
        // Try to get from cache first
        const cached = await storeCache.getStoreAnalytics(storeId);
        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }
        
        // Get basic counts
        const productCount = await Product.countDocuments({ store: storeId, isActive: true });
        const orderCount = await Order.countDocuments({ store: storeId });
        const categoryCount = await Category.countDocuments({ store: storeId, isActive: true });
        
        // Get recent orders
        const recentOrders = await Order.find({ store: storeId })
            .sort({ dateOrdered: -1 })
            .limit(10)
            .populate('customer', 'name email');
        
        // Get top products
        const topProducts = await Product.find({ store: storeId, isActive: true })
            .sort({ rating: -1, numReviews: -1 })
            .limit(5);
        
        // Calculate revenue (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentOrdersRevenue = await Order.aggregate([
            { $match: { store: storeId, dateOrdered: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        
        const monthlyRevenue = recentOrdersRevenue[0]?.total || 0;
        
        const analytics = {
            productCount,
            orderCount,
            categoryCount,
            monthlyRevenue,
            recentOrders,
            topProducts
        };
        
        // Cache the result
        await storeCache.setStoreAnalytics(storeId, analytics);
        
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid store ID format'
            });
        }
        
        console.error('Get store analytics error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Add admin to store
 */
const addStoreAdmin = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const storeId = req.params.id;
    
    const store = await Store.findById(storeId);
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    // Check if user has permission
    if (store.owner.toString() !== req.user._id.toString() && !req.user.isPlatformAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    // Add user as admin
    if (!store.admins.includes(user._id)) {
        store.admins.push(user._id);
        await store.save();
        
        // Update user's admin stores
        await User.findByIdAndUpdate(user._id, {
            $push: { adminStores: store._id }
        });
    }
    
    res.json({
        success: true,
        message: 'Admin added successfully'
    });
});

/**
 * Remove admin from store
 */
const removeStoreAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const storeId = req.params.id;
    
    const store = await Store.findById(storeId);
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    // Check if user has permission
    if (store.owner.toString() !== req.user._id.toString() && !req.user.isPlatformAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    
    // Remove user as admin
    store.admins = store.admins.filter(adminId => adminId.toString() !== userId);
    await store.save();
    
    // Update user's admin stores
    await User.findByIdAndUpdate(userId, {
        $pull: { adminStores: store._id }
    });
    
    res.json({
        success: true,
        message: 'Admin removed successfully'
    });
});

/**
 * Delete store (soft delete)
 */
const deleteStore = asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    // Check if user has permission
    if (store.owner.toString() !== req.user._id.toString() && !req.user.isPlatformAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    
    // Soft delete - set as inactive
    store.isActive = false;
    await store.save();
    
    res.json({
        success: true,
        message: 'Store deactivated successfully'
    });
});

/**
 * Discover stores (public endpoint)
 */
const discoverStores = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    try {
        // Create cache key from query parameters
        const queryKey = { page, limit, search, category };
        
        // Try to get from cache first
        const cached = await storeCache.getStoreDiscovery(queryKey);
        if (cached) {
            return res.json({
                success: true,
                data: cached.data,
                pagination: cached.pagination,
                cached: true
            });
        }
        
        const filter = { isActive: true, isVerified: true };
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) {
            filter['subscription.plan'] = category;
        }
        
        const stores = await Store.find(filter)
            .populate('owner', 'name')
            .sort({ dateCreated: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        
        const total = await Store.countDocuments(filter);
        
        const result = {
            data: stores,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
        
        // Cache the result
        await storeCache.setStoreDiscovery(queryKey, result);
        
        res.json({
            success: true,
            data: stores,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Store discovery error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get store settings
 */
const getStoreSettings = asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    res.json({
        success: true,
        data: {
            settings: store.settings,
            contactInfo: store.contactInfo
        }
    });
});

/**
 * Update store settings
 */
const updateStoreSettings = asyncHandler(async (req, res) => {
    const { settings, contactInfo } = req.body;
    
    const store = await Store.findById(req.params.id);
    
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    // Check if user has permission to update
    if (store.owner.toString() !== req.user._id.toString() && 
        !store.admins.includes(req.user._id) && 
        !req.user.isPlatformAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    
    // Update fields
    if (settings) store.settings = { ...store.settings, ...settings };
    if (contactInfo) store.contactInfo = { ...store.contactInfo, ...contactInfo };
    
    await store.save();
    
    res.json({
        success: true,
        data: store,
        message: 'Store settings updated successfully'
    });
});

/**
 * Get store theme
 */
const getStoreTheme = asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    res.json({
        success: true,
        data: {
            theme: store.theme
        }
    });
});

/**
 * Update store theme
 */
const updateStoreTheme = asyncHandler(async (req, res) => {
    const { theme } = req.body;
    
    const store = await Store.findById(req.params.id);
    
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    // Check if user has permission to update
    if (store.owner.toString() !== req.user._id.toString() && 
        !store.admins.includes(req.user._id) && 
        !req.user.isPlatformAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    
    // Update theme
    if (theme) store.theme = { ...store.theme, ...theme };
    
    await store.save();
    
    res.json({
        success: true,
        data: store,
        message: 'Store theme updated successfully'
    });
});

module.exports = {
    createStore,
    getUserStores,
    getStore,
    updateStore,
    getStoreAnalytics,
    addStoreAdmin,
    removeStoreAdmin,
    deleteStore,
    discoverStores,
    getStoreSettings,
    updateStoreSettings,
    getStoreTheme,
    updateStoreTheme
}; 