const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const User = require('../../models/user');

// Custom middleware to check if user has stores and redirect accordingly
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
            return res.redirect('admin/create-store');
        }
        
        // User has stores, proceed with normal flow
        next();
    } catch (error) {
        console.error('Check user stores error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin order management pages (with store isolation)
router.get('/orders', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/orders');
});

router.get('/orders/:id', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/order-details');
});

router.get('/refund', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), (req, res) => {
    res.render('admin/refund');
});

module.exports = router; 