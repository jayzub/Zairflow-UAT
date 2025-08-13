const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const { getAllProductTypes } = require('../../config/productTypes');

// Get product types configuration (for admin forms)
router.get('/product-types/config', requireAuth, (req, res) => {
    try {
        const productTypes = getAllProductTypes();
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
});

module.exports = router;
