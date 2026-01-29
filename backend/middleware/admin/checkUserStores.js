// Custom middleware to check if user has stores and redirect accordingly
const User = require('../../models/user');
const checkUserStores = async (req, res, next) => {
    try {
        // Platform admins can always access dashboard
        if (req.user.isPlatformAdmin) {
            return next();
        }
        
        // Check if user has any stores
        const user = await User.findById(req.user._id)
            .populate('ownedStores')
            .populate('adminStores');
        
        const hasStores = (user.ownedStores && user.ownedStores.length > 0) || 
                         (user.adminStores && user.adminStores.length > 0);
        
        if (!hasStores) {
            // User has no stores, redirect to create-store page
            return res.redirect('/admin/create-store');
        }
        
        // User has stores, proceed with normal flow
        next();
    } catch (error) {
        console.error('Check user stores error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { checkUserStores };