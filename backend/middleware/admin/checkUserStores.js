// Custom middleware to check if user has stores and redirect accordingly
const User = require('../../models/user');
const checkUserStores = async (req, res, next) => {
    try {
        // Platform admins can always access dashboard
        if (req.user.isPlatformAdmin) {
            return next();
        }
        
        const wantsJson =
            (req.headers.accept || '').includes('application/json') ||
            Boolean(req.xhr) ||
            Boolean(req.headers.authorization) ||
            (req.headers['content-type'] || '').includes('application/json');

        // Check if user has any stores
        const user = await User.findById(req.user._id)
            .populate('ownedStores')
            .populate('adminStores');
        
        const hasStores = (user.ownedStores && user.ownedStores.length > 0) || 
                         (user.adminStores && user.adminStores.length > 0);
        
        if (!hasStores) {
            // User has no stores
            if (wantsJson) {
                return res.status(400).json({
                    success: false,
                    message: 'No stores found for this user. Create a store first.',
                    redirect: '/admin/create-store'
                });
            }

            // HTML page flow: redirect to create-store page
            return res.redirect('/admin/create-store');
        }
        
        // User has stores, proceed with normal flow
        next();
    } catch (error) {
        console.error('Check user stores error:', error);
        // Let centralized error handler decide how to respond
        next(error);
    }
};

module.exports = { checkUserStores };