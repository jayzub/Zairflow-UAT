require('dotenv').config();
const { asyncHandler } = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const adminCustomProductTypesService = require('../../services/admin/adminCustomProductTypesService');

// Render custom product types management page
exports.customProductTypesPage = asyncHandler(async (req, res) => {
    try {
        res.render('admin/custom-product-types', {
            pageTitle: 'Custom Product Types',
            customProductTypes: []
        });
    } catch (error) {
        console.error('Error rendering custom product types page:', error);
        res.status(500).render('admin/error', {
            pageTitle: 'Error',
            message: 'Failed to load custom product types page',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all custom product types for a store
exports.getCustomProductTypes = asyncHandler(async (req, res) => {
    try {
        const storeId = req.store?._id;

        const result = await adminCustomProductTypesService.listCustomProductTypes({ storeId });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error fetching custom product types:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching custom product types',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get a single custom product type
exports.getCustomProductType = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store?._id;

        const result = await adminCustomProductTypesService.getCustomProductType({ storeId, id });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error fetching custom product type:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching custom product type',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Create a new custom product type
exports.createCustomProductType = asyncHandler(async (req, res) => {
    try {
        const storeId = req.store?._id;

        const result = await adminCustomProductTypesService.createCustomProductType({
            storeId,
            body: req.body,
            userId: req.user?._id,
        });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error creating custom product type:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A custom product type with this name already exists for this store'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating custom product type',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update a custom product type
exports.updateCustomProductType = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store?._id;

        const result = await adminCustomProductTypesService.updateCustomProductType({
            storeId,
            id,
            body: req.body,
        });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error updating custom product type:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating custom product type',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Delete a custom product type (soft delete)
exports.deleteCustomProductType = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const storeId = req.store?._id;

        const result = await adminCustomProductTypesService.deleteCustomProductType({ storeId, id });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error deleting custom product type:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting custom product type',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

