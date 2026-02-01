const { asyncHandler } = require('../../middleware/asyncHandler');
const adminStoresService = require('../../services/admin/adminStoresService');

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
    const store = await adminStoresService.createStore({ userId: req.user._id, body: req.body });

    res.status(201).json({
        success: true,
        message: 'Store created successfully',
        data: store
    });
});

// Admin: Get store details (admin function)
exports.getStoreDetails = asyncHandler(async (req, res) => {
    const store = await adminStoresService.getStoreDetails(req.params.id);
    
    if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    res.status(200).json({
        success: true,
        data: store
    });
});

// Admin: Update store (admin function)
exports.updateStore = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminStoresService.updateStore({ storeId: id, body: req.body, currentUser: req.user });
    if (!result.ok && result.reason === 'not_found') {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (!result.ok && result.reason === 'forbidden') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({
        success: true,
        message: 'Store updated successfully',
        data: result.store
    });
});

// Admin: Delete store (admin function)
exports.deleteStore = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminStoresService.deleteStore({ storeId: id, currentUser: req.user });
    if (!result.ok && result.reason === 'not_found') {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (!result.ok && result.reason === 'forbidden') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({
        success: true,
        message: 'Store deleted successfully'
    });
});

// Admin: Get store analytics
exports.getStoreAnalytics = asyncHandler(async (req, res) => {
    const storeId = req.params.id;
    const analytics = await adminStoresService.getStoreAnalytics(storeId);
    
    res.status(200).json({
        success: true,
        data: analytics
    });
});

// Admin: Add admin to store
exports.addStoreAdmin = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const storeId = req.params.id;
    const result = await adminStoresService.addStoreAdmin({ storeId, email, currentUser: req.user });
    if (!result.ok && result.reason === 'store_not_found') {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (!result.ok && result.reason === 'user_not_found') {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!result.ok && result.reason === 'forbidden') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.status(200).json({
        success: true,
        message: 'Admin added successfully'
    });
});

// Admin: Remove admin from store
exports.removeStoreAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const storeId = req.params.id;
    const result = await adminStoresService.removeStoreAdmin({ storeId, userId, currentUser: req.user });
    if (!result.ok && result.reason === 'store_not_found') {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (!result.ok && result.reason === 'forbidden') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.status(200).json({
        success: true,
        message: 'Admin removed successfully'
    });
});

// Admin: Get store settings
exports.getStoreSettings = asyncHandler(async (req, res) => {
    const data = await adminStoresService.getStoreSettings(req.params.id);
    
    if (!data) {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    res.status(200).json({
        success: true,
        data
    });
});

// Admin: Update store settings
exports.updateStoreSettings = asyncHandler(async (req, res) => {
    const result = await adminStoresService.updateStoreSettings({
        storeId: req.params.id,
        body: req.body,
        currentUser: req.user
    });
    if (!result.ok && result.reason === 'not_found') {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (!result.ok && result.reason === 'forbidden') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.status(200).json({
        success: true,
        data: result.store,
        message: 'Store settings updated successfully'
    });
});

// Admin: Get store theme
exports.getStoreTheme = asyncHandler(async (req, res) => {
    const data = await adminStoresService.getStoreTheme(req.params.id);
    
    if (!data) {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    res.status(200).json({
        success: true,
        data
    });
});

// Admin: Update store theme
exports.updateStoreTheme = asyncHandler(async (req, res) => {
    const result = await adminStoresService.updateStoreTheme({
        storeId: req.params.id,
        body: req.body,
        currentUser: req.user
    });
    if (!result.ok && result.reason === 'not_found') {
        return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (!result.ok && result.reason === 'forbidden') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.status(200).json({
        success: true,
        data: result.store,
        message: 'Store theme updated successfully'
    });
});

// Admin: Get user's stores
exports.getUserStores = asyncHandler(async (req, res) => {
    const stores = await adminStoresService.getUserStores({
        userId: req.user._id,
        userRole: req.user.role,
        isPlatformAdmin: req.user.isPlatformAdmin
    });

    res.status(200).json({
        success: true,
        data: stores
    });
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