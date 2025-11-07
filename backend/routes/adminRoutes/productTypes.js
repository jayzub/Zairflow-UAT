const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { checkUserStores } = require('../../middleware/admin/checkUserStores');
const { extractStore, requireStoreAccess } = require('../../middleware/storeIsolation');
const { getAllProductTypesWithCustom } = require('../../config/productTypes');
const { asyncHandler } = require('../../middleware/asyncHandler');

// Get product types configuration (for admin forms) - includes custom product types
router.get('/product-types/config', requireAuth, checkUserStores, extractStore, requireStoreAccess('any'), asyncHandler(async (req, res) => {
    try {
        const storeId = req.store?._id;
        const productTypes = await getAllProductTypesWithCustom(storeId);
        res.json({
            success: true,
            data: productTypes
        });
    } catch (error) {
        console.error('Error fetching product types config:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product types configuration',
            error: error.message
        });
    }
}));

module.exports = router;
