const { asyncHandler } = require('../../middleware/asyncHandler');
const BaseProduct = require('../../models/products/baseProduct');
const Category = require('../../models/category');

// Admin: Dashboard statistics
exports.getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Build filter for store isolation - platform admins see all, others see their store only
        let filter = { isActive: true };
        if (!req.user.isPlatformAdmin && req.store) {
            filter.store = req.store._id;
        }

        const [totalProducts, featuredProducts, lowStockProducts, totalCategories] = await Promise.all([
            BaseProduct.countDocuments(filter),
            BaseProduct.countDocuments({ ...filter, isFeatured: true }),
            BaseProduct.countDocuments({ ...filter, countInStock: { $lt: 10 } }),
            Category.countDocuments(!req.user.isPlatformAdmin && req.store ? { store: req.store._id } : {})
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                featuredProducts,
                lowStockProducts,
                totalCategories
            }
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
}); 