const Store = require('../models/store');
const { asyncHandler } = require('../middleware/asyncHandler');
const storeCache = require('../utils/cache');

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

module.exports = {
    discoverStores
}; 