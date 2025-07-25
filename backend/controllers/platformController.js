const Store = require('../models/store');
const User = require('../models/user');
const Customer = require('../models/customer');
const Product = require('../models/products/baseProduct');
const Order = require('../models/order');
const { asyncHandler } = require('../middleware/asyncHandler').default;

/**
 * Get platform overview statistics
 */
const getPlatformOverview = asyncHandler(async (req, res) => {
    // Get total counts
    const totalStores = await Store.countDocuments();
    const activeStores = await Store.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    
    // Get subscription breakdown
    const subscriptionStats = await Store.aggregate([
        {
            $group: {
                _id: '$subscription.plan',
                count: { $sum: 1 }
            }
        }
    ]);
    
    // Get recent stores
    const recentStores = await Store.find()
        .sort({ dateCreated: -1 })
        .limit(10)
        .populate('owner', 'name email');
    
    // Get top performing stores (by revenue)
    const topStores = await Order.aggregate([
        {
            $group: {
                _id: '$store',
                totalRevenue: { $sum: '$totalPrice' },
                orderCount: { $sum: 1 }
            }
        },
        {
            $sort: { totalRevenue: -1 }
        },
        {
            $limit: 10
        },
        {
            $lookup: {
                from: 'stores',
                localField: '_id',
                foreignField: '_id',
                as: 'store'
            }
        },
        {
            $unwind: '$store'
        }
    ]);
    
    // Calculate monthly revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyRevenue = await Order.aggregate([
        {
            $match: { dateOrdered: { $gte: thirtyDaysAgo } }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalPrice' }
            }
        }
    ]);
    
    res.json({
        success: true,
        data: {
            overview: {
                totalStores,
                activeStores,
                totalUsers,
                totalCustomers,
                totalProducts,
                totalOrders,
                monthlyRevenue: monthlyRevenue[0]?.total || 0
            },
            subscriptionStats,
            recentStores,
            topStores
        }
    });
});

/**
 * Get all stores (platform admin only)
 */
const getAllStores = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const plan = req.query.plan || '';
    
    const filter = {};
    
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } }
        ];
    }
    
    if (status) {
        filter.isActive = status === 'active';
    }
    
    if (plan) {
        filter['subscription.plan'] = plan;
    }
    
    const stores = await Store.find(filter)
        .populate('owner', 'name email')
        .sort({ dateCreated: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    
    const total = await Store.countDocuments(filter);
    
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
});

/**
 * Update store subscription
 */
const updateStoreSubscription = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { plan, features, endDate } = req.body;
    
    const store = await Store.findById(storeId);
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    // Update subscription
    store.subscription.plan = plan;
    if (features) store.subscription.features = features;
    if (endDate) store.subscription.endDate = new Date(endDate);
    
    await store.save();
    
    res.json({
        success: true,
        data: store,
        message: 'Subscription updated successfully'
    });
});

/**
 * Verify store
 */
const verifyStore = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { isVerified } = req.body;
    
    const store = await Store.findById(storeId);
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    store.isVerified = isVerified;
    await store.save();
    
    res.json({
        success: true,
        data: store,
        message: `Store ${isVerified ? 'verified' : 'unverified'} successfully`
    });
});

/**
 * Get platform analytics
 */
const getPlatformAnalytics = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Revenue analytics
    const revenueData = await Order.aggregate([
        {
            $match: { dateOrdered: { $gte: startDate } }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$dateOrdered' }
                },
                revenue: { $sum: '$totalPrice' },
                orders: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
    
    // Store growth
    const storeGrowth = await Store.aggregate([
        {
            $match: { dateCreated: { $gte: startDate } }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$dateCreated' }
                },
                stores: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
    
    // User growth
    const userGrowth = await User.aggregate([
        {
            $match: { createdAt: { $gte: startDate } }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                users: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Customer growth
    const customerGrowth = await Customer.aggregate([
        {
            $match: { createdAt: { $gte: startDate } }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                customers: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
    
    res.json({
        success: true,
        data: {
            revenueData,
            storeGrowth,
            userGrowth,
            customerGrowth
        }
    });
});

/**
 * Get store details for platform admin
 */
const getStoreDetails = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    
    const store = await Store.findById(storeId)
        .populate('owner', 'name email phone')
        .populate('admins', 'name email');
    
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    // Get store statistics
    const productCount = await Product.countDocuments({ store: storeId, isActive: true });
    const orderCount = await Order.countDocuments({ store: storeId });
    const totalRevenue = await Order.aggregate([
        { $match: { store: storeId } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    // Get recent activity
    const recentOrders = await Order.find({ store: storeId })
        .sort({ dateOrdered: -1 })
        .limit(5)
        .populate('customer', 'name email');
    
    const recentProducts = await Product.find({ store: storeId, isActive: true })
        .sort({ dateCreated: -1 })
        .limit(5);
    
    res.json({
        success: true,
        data: {
            store,
            statistics: {
                productCount,
                orderCount,
                totalRevenue: totalRevenue[0]?.total || 0
            },
            recentActivity: {
                orders: recentOrders,
                products: recentProducts
            }
        }
    });
});

/**
 * Suspend/activate store
 */
const toggleStoreStatus = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { isActive } = req.body;
    
    const store = await Store.findById(storeId);
    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }
    
    store.isActive = isActive;
    await store.save();
    
    res.json({
        success: true,
        data: store,
        message: `Store ${isActive ? 'activated' : 'suspended'} successfully`
    });
});

module.exports = {
    getPlatformOverview,
    getAllStores,
    updateStoreSubscription,
    verifyStore,
    getPlatformAnalytics,
    getStoreDetails,
    toggleStoreStatus
}; 