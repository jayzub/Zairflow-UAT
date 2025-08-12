const mongoose = require('mongoose');
const Category = require('../models/category');
const BaseProduct = require('../models/products/baseProduct');
const { asyncHandler } = require('../middleware/asyncHandler');
const { respondWithViewOrJson } = require('../helpers/respondWithViewOrJson');
const { getProductTypesForPlan } = require('../helpers/productHelpers');

/**
 * Get all categories for a store (Public - for customers)
 */
exports.getAllCategories = asyncHandler(async (req, res) => {
    const { storeSlug } = req.params;
    const { productType, isActive } = req.query;
    
    // Find store by slug first
    const Store = require('../models/store');
    const store = await Store.findOne({ slug: storeSlug, isActive: true });
    
    if (!store) {
        return res.status(404).json({
            success: false,
            message: 'Store not found'
        });
    }
    
    // Build filter
    const filter = { store: store._id };
    
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    } else {
        // For public routes, only show active categories by default
        filter.isActive = true;
    }
    
    if (productType) {
        filter.allowedProductTypes = productType;
    }
    
    const categories = await Category.find(filter)
        .populate('parent', 'name slug')
        .populate('children', 'name slug')
        .sort({ displayOrder: 1, name: 1 });
    
    // Add product count to each category
    const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
            const productCount = await BaseProduct.countDocuments({
                category: category._id,
                store: store._id,
                isActive: true
            });
            
            return {
                ...category.toObject(),
                productCount
            };
        })
    );
    
    return res.status(200).json({
        success: true,
        data: categoriesWithCount
    });
});

/**
 * Get category by ID (Public - for customers)
 */
exports.getCategoryById = asyncHandler(async (req, res) => {
    const { categoryId, storeSlug } = req.params;
    
    if (!mongoose.isValidObjectId(categoryId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid category ID' 
        });
    }
    
    // Find store by slug first
    const Store = require('../models/store');
    const store = await Store.findOne({ slug: storeSlug, isActive: true });
    
    if (!store) {
        return res.status(404).json({
            success: false,
            message: 'Store not found'
        });
    }
    
    const category = await Category.findOne({
        _id: categoryId,
        store: store._id,
        isActive: true // Only show active categories to public
    }).populate('parent', 'name slug')
      .populate('children', 'name slug');
    
    if (!category) {
        return res.status(404).json({ 
            success: false, 
            message: 'Category not found' 
        });
    }
    
    // Get product count
    const productCount = await BaseProduct.countDocuments({
        category: category._id,
        store: store._id,
        isActive: true
    });
    
    const categoryData = {
        ...category.toObject(),
        productCount
    };
    
    return res.status(200).json({
        success: true,
        data: categoryData
    });
});

/**
 * Get products by category (Public - for customers)
 */
exports.getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId, storeSlug } = req.params;
    const { page = 1, limit = 20, sort = 'dateCreated', order = 'desc' } = req.query;
    
    if (!mongoose.isValidObjectId(categoryId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid category ID' 
        });
    }
    
    // Find store by slug first
    const Store = require('../models/store');
    const store = await Store.findOne({ slug: storeSlug, isActive: true });
    
    if (!store) {
        return res.status(404).json({
            success: false,
            message: 'Store not found'
        });
    }
    
    // Check if category exists and belongs to store
    const category = await Category.findOne({
        _id: categoryId,
        store: store._id,
        isActive: true // Only show active categories to public
    });
    
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }
    
    // Build product filter
    const filter = {
        category: categoryId,
        store: store._id,
        isActive: true
    };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    
    // Get products with pagination
    const products = await BaseProduct.find(filter)
        .populate('category', 'name slug')
        .populate('vendor', 'name')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit));
    
    // Get total count
    const totalProducts = await BaseProduct.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    return res.status(200).json({
        success: true,
        data: {
            category,
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalProducts,
                pages: totalPages
            }
        }
    });
});

/**
 * Get category tree (hierarchical structure) - Public
 */
exports.getCategoryTree = asyncHandler(async (req, res) => {
    const { storeSlug } = req.params;
    const { productType } = req.query;
    
    // Find store by slug first
    const Store = require('../models/store');
    const store = await Store.findOne({ slug: storeSlug, isActive: true });
    
    if (!store) {
        return res.status(404).json({
            success: false,
            message: 'Store not found'
        });
    }
    
    const filter = { store: store._id, isActive: true };
    
    if (productType) {
        filter.allowedProductTypes = productType;
    }
    
    const categories = await Category.find(filter)
        .populate('children', 'name slug isActive')
        .sort({ displayOrder: 1, name: 1 });
    
    // Build tree structure
    const buildTree = (items, parentId = null) => {
        return items
            .filter(item => 
                parentId === null 
                    ? !item.parent 
                    : item.parent && item.parent.toString() === parentId
            )
            .map(item => ({
                ...item.toObject(),
                children: buildTree(items, item._id.toString())
            }));
    };
    
    const categoryTree = buildTree(categories);
    
    return res.status(200).json({
        success: true,
        data: categoryTree
    });
}); 