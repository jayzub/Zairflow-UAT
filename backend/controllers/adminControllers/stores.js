const { asyncHandler } = require('../../middleware/asyncHandler');
const Store = require('../../models/store');
const User = require('../../models/user');
const Product = require('../../models/products/baseProduct');
const Category = require('../../models/category');
const Order = require('../../models/order');

// Admin: Render create store page
exports.createStorePage = asyncHandler(async (req, res) => {
    try {
        res.render('admin/create-store', { 
            pageTitle: 'Create Store'
        });
    } catch (error) {
        console.error('Error loading create store page:', error);
        res.status(500).render('admin/error', { error: 'Failed to load create store page' });
    }
});

// Admin: Create a new store (admin function)
exports.createStore = asyncHandler(async (req, res) => {
    try {
        const { name, description, address, phone, email, website } = req.body;
        
        const storeData = {
            name,
            description,
            address,
            phone,
            email,
            website,
            owner: req.user._id
        };

        const store = new Store(storeData);
        await store.save();

        // Add store to user's owned stores
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { ownedStores: store._id } }
        );

        res.status(201).json({
            success: true,
            message: 'Store created successfully',
            data: store
        });
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating store',
            error: error.message
        });
    }
});

// Admin: Get store details (admin function)
exports.getStoreDetails = asyncHandler(async (req, res) => {
    try {
        const store = await Store.findById(req.params.id)
            .populate('owner', 'firstName lastName email')
            .populate('admins', 'firstName lastName email');
        
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        
        res.status(200).json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error('Error fetching store details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching store details',
            error: error.message
        });
    }
});

// Admin: Update store (admin function)
exports.updateStore = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, address, phone, email, website } = req.body;
        
        const store = await Store.findById(id);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Check if user has permission to update this store
        if (!req.user.isPlatformAdmin && store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const updateData = {
            name,
            description,
            address,
            phone,
            email,
            website
        };

        const updatedStore = await Store.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Store updated successfully',
            data: updatedStore
        });
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating store',
            error: error.message
        });
    }
});

// Admin: Delete store (admin function)
exports.deleteStore = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        const store = await Store.findById(id);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Check if user has permission to delete this store
        if (!req.user.isPlatformAdmin && store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await Store.findByIdAndDelete(id);

        // Remove store from user's owned stores
        await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { ownedStores: id } }
        );

        res.status(200).json({
            success: true,
            message: 'Store deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting store',
            error: error.message
        });
    }
});

// Admin: Get store analytics
exports.getStoreAnalytics = asyncHandler(async (req, res) => {
    try {
        const storeId = req.params.id;
        
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
        
        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching store analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching store analytics',
            error: error.message
        });
    }
});

// Admin: Add admin to store
exports.addStoreAdmin = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        const storeId = req.params.id;
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        
        // Check if user has permission
        if (store.owner.toString() !== req.user._id.toString() && !req.user.isPlatformAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
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
        
        res.status(200).json({
            success: true,
            message: 'Admin added successfully'
        });
    } catch (error) {
        console.error('Error adding store admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding store admin',
            error: error.message
        });
    }
});

// Admin: Remove admin from store
exports.removeStoreAdmin = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.body;
        const storeId = req.params.id;
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        
        // Check if user has permission
        if (store.owner.toString() !== req.user._id.toString() && !req.user.isPlatformAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        // Remove user as admin
        store.admins = store.admins.filter(adminId => adminId.toString() !== userId);
        await store.save();
        
        // Update user's admin stores
        await User.findByIdAndUpdate(userId, {
            $pull: { adminStores: store._id }
        });
        
        res.status(200).json({
            success: true,
            message: 'Admin removed successfully'
        });
    } catch (error) {
        console.error('Error removing store admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing store admin',
            error: error.message
        });
    }
});

// Admin: Get store settings
exports.getStoreSettings = asyncHandler(async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        
        res.status(200).json({
            success: true,
            data: {
                settings: store.settings,
                contactInfo: store.contactInfo
            }
        });
    } catch (error) {
        console.error('Error fetching store settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching store settings',
            error: error.message
        });
    }
});

// Admin: Update store settings
exports.updateStoreSettings = asyncHandler(async (req, res) => {
    try {
        const { settings, contactInfo } = req.body;
        
        const store = await Store.findById(req.params.id);
        
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        
        // Check if user has permission to update
        if (store.owner.toString() !== req.user._id.toString() && 
            !store.admins.includes(req.user._id) && 
            !req.user.isPlatformAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        // Update fields
        if (settings) store.settings = { ...store.settings, ...settings };
        if (contactInfo) store.contactInfo = { ...store.contactInfo, ...contactInfo };
        
        await store.save();
        
        res.status(200).json({
            success: true,
            data: store,
            message: 'Store settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating store settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating store settings',
            error: error.message
        });
    }
});

// Admin: Get store theme
exports.getStoreTheme = asyncHandler(async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        
        res.status(200).json({
            success: true,
            data: {
                theme: store.theme
            }
        });
    } catch (error) {
        console.error('Error fetching store theme:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching store theme',
            error: error.message
        });
    }
});

// Admin: Update store theme
exports.updateStoreTheme = asyncHandler(async (req, res) => {
    try {
        const { theme } = req.body;
        
        const store = await Store.findById(req.params.id);
        
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        
        // Check if user has permission to update
        if (store.owner.toString() !== req.user._id.toString() && 
            !store.admins.includes(req.user._id) && 
            !req.user.isPlatformAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        // Update theme
        if (theme) store.theme = { ...store.theme, ...theme };
        
        await store.save();
        
        res.status(200).json({
            success: true,
            data: store,
            message: 'Store theme updated successfully'
        });
    } catch (error) {
        console.error('Error updating store theme:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating store theme',
            error: error.message
        });
    }
});

// Admin: Get user's stores
exports.getUserStores = asyncHandler(async (req, res) => {
    try {
        // Get stores where user is owner or admin
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
                $lookup: {
                    from: 'users',
                    localField: 'admins',
                    foreignField: '_id',
                    as: 'admins'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    slug: 1,
                    isActive: 1,
                    isVerified: 1,
                    dateCreated: 1,
                    'owner._id': 1,
                    'owner.firstName': 1,
                    'owner.lastName': 1,
                    'owner.email': 1,
                    'admins._id': 1,
                    'admins.firstName': 1,
                    'admins.lastName': 1,
                    'admins.email': 1,
                    subscription: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stores
        });
    } catch (error) {
        console.error('Error fetching user stores:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user stores',
            error: error.message
        });
    }
});

// Admin: Render stores list page
exports.listStoresPage = asyncHandler(async (req, res) => {
    try {
        res.render('admin/stores-list', { 
            pageTitle: 'My Stores'
        });
    } catch (error) {
        console.error('Error loading stores list page:', error);
        res.status(500).render('admin/error', { error: 'Failed to load stores list page' });
    }
}); 