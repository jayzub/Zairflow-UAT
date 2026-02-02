const { asyncHandler } = require('../../middleware/asyncHandler');
const adminDashboardService = require('../../services/admin/adminDashboardService');

// Admin: Dashboard statistics
exports.getDashboardStats = asyncHandler(async (req, res) => {
    try {
        const { totalProducts, featuredProducts, lowStockProducts, totalCategories } =
            await adminDashboardService.getDashboardStats({ currentUser: req.user, store: req.store });

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