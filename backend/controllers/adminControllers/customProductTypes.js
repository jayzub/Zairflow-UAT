require('dotenv').config();
const CustomProductType = require('../../models/customProductType');
const { asyncHandler } = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');

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
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required'
            });
        }
        
        const customTypes = await CustomProductType.getByStore(storeId);
        
        res.json({
            success: true,
            data: customTypes.map(type => ({
                ...type.toProductTypeConfig(),
                _id: type._id.toString(),
                id: type._id.toString()
            }))
        });
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
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required'
            });
        }
        
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid custom product type ID'
            });
        }
        
        const customType = await CustomProductType.findOne({
            _id: id,
            store: storeId
        });
        
        if (!customType) {
            return res.status(404).json({
                success: false,
                message: 'Custom product type not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                ...customType.toProductTypeConfig(),
                _id: customType._id.toString(),
                id: customType._id.toString()
            }
        });
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
        const { body } = req;
        const storeId = req.store?._id;
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required'
            });
        }
        
        // Validate required fields
        if (!body.name || !body.displayName) {
            return res.status(400).json({
                success: false,
                message: 'Name and display name are required'
            });
        }
        
        // Check if custom product type with same name already exists for this store
        const existing = await CustomProductType.getByNameAndStore(body.name, storeId);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `A custom product type with name "${body.name}" already exists for this store`
            });
        }
        
        // Validate fields structure
        if (body.fields && typeof body.fields !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Fields must be an object'
            });
        }
        
        // Convert fields object to Map
        const fieldsMap = new Map();
        if (body.fields) {
            Object.entries(body.fields).forEach(([key, value]) => {
                fieldsMap.set(key, value);
            });
        }
        
        // Create custom product type
        const customType = new CustomProductType({
            store: storeId,
            name: body.name,
            displayName: body.displayName,
            description: body.description || '',
            icon: body.icon || 'fas fa-box',
            color: body.color || '#6c757d',
            fields: fieldsMap,
            variantFields: body.variantFields || [],
            createdBy: req.user._id,
            isActive: body.isActive !== undefined ? body.isActive : true
        });
        
        const savedType = await customType.save();
        
        res.status(201).json({
            success: true,
            data: savedType.toProductTypeConfig(),
            message: 'Custom product type created successfully'
        });
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
        const { body } = req;
        const storeId = req.store?._id;
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required'
            });
        }
        
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid custom product type ID'
            });
        }
        
        const customType = await CustomProductType.findOne({
            _id: id,
            store: storeId
        });
        
        if (!customType) {
            return res.status(404).json({
                success: false,
                message: 'Custom product type not found'
            });
        }
        
        // Update fields
        if (body.displayName) customType.displayName = body.displayName;
        if (body.description !== undefined) customType.description = body.description;
        if (body.icon) customType.icon = body.icon;
        if (body.color) customType.color = body.color;
        if (body.variantFields) customType.variantFields = body.variantFields;
        if (body.isActive !== undefined) customType.isActive = body.isActive;
        
        // Update fields Map
        if (body.fields) {
            const fieldsMap = new Map();
            Object.entries(body.fields).forEach(([key, value]) => {
                fieldsMap.set(key, value);
            });
            customType.fields = fieldsMap;
        }
        
        customType.dateUpdated = new Date();
        
        const updatedType = await customType.save();
        
        res.json({
            success: true,
            data: updatedType.toProductTypeConfig(),
            message: 'Custom product type updated successfully'
        });
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
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required'
            });
        }
        
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid custom product type ID'
            });
        }
        
        const customType = await CustomProductType.findOne({
            _id: id,
            store: storeId
        });
        
        if (!customType) {
            return res.status(404).json({
                success: false,
                message: 'Custom product type not found'
            });
        }
        
        // Check if any products are using this custom product type
        const BaseProduct = require('../../models/products/baseProduct');
        const productsUsingType = await BaseProduct.countDocuments({
            productType: customType.name,
            store: storeId
        });
        
        if (productsUsingType > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete custom product type. ${productsUsingType} product(s) are using this type. Please update or delete those products first.`
            });
        }
        
        // Soft delete by setting isActive to false
        customType.isActive = false;
        customType.dateUpdated = new Date();
        await customType.save();
        
        res.json({
            success: true,
            message: 'Custom product type deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting custom product type:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting custom product type',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

