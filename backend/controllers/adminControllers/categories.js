const { asyncHandler } = require('../../middleware/asyncHandler');
const Category = require('../../models/category');
const mongoose = require('mongoose');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');

// Admin: Get all categories for a store
exports.getAllCategories = asyncHandler(async (req, res) => {
    try {
        const categories = await Category.find({ store: req.store._id })
            .populate('parent', 'name')
            .populate('children', 'name')
            .sort({ displayOrder: 1, name: 1 });
        
        const data = { 
            categories,
            pageTitle: 'Categories'
        };
        
        // Use the helper function to determine response format
        respondWithViewOrJson(req, res, 'admin/categories/index', data);
    } catch (error) {
        console.error('Error fetching categories:', error);
        if (req.accepts('html')) {
            res.status(500).render('admin/error', { error: 'Failed to load categories' });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to load categories',
                error: error.message
            });
        }
    }
});

// Admin: Render add category page
exports.addCategoryPage = asyncHandler(async (req, res) => {
    try {
        // Fetch existing categories for parent selection
        const categories = await Category.find({ store: req.store._id })
            .select('name _id')
            .sort({ name: 1 });
        
        res.render('admin/categories/add-category', { 
            categories,
            pageTitle: 'Add Category'
        });
    } catch (error) {
        console.error('Error loading add category page:', error);
        res.status(500).render('admin/error', { error: 'Failed to load add category page' });
    }
});

// Admin: Render edit category page
exports.editCategoryPage = asyncHandler(async (req, res) => {
    try {
        const category = await Category.findOne({ 
            _id: req.params.id, 
            store: req.store._id 
        });
        
        if (!category) {
            return res.status(404).render('admin/error', { error: 'Category not found' });
        }
        
        // Fetch all categories for parent selection
        const categories = await Category.find({ store: req.store._id })
            .select('name _id')
            .sort({ name: 1 });
        
        res.render('admin/categories/edit-category', { 
            category,
            categories,
            pageTitle: 'Edit Category'
        });
    } catch (error) {
        console.error('Error loading edit category page:', error);
        res.status(500).render('admin/error', { error: 'Failed to load edit category page' });
    }
});

// Admin: Create a new category
exports.createCategory = asyncHandler(async (req, res) => {
    try {
        // Debug: Log the request body
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);
        
        const { name, description, parent, displayOrder, isActive, slug: providedSlug } = req.body;
        
        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required and must be a non-empty string',
                receivedData: { name, description, parent, displayOrder, isActive, slug: providedSlug }
            });
        }
        
        // Generate slug from name if not provided
        const generateSlug = (name) => {
            if (!name || typeof name !== 'string') {
                throw new Error('Name parameter is required and must be a string');
            }
            return name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
        };
        
        let slug = providedSlug || generateSlug(name);
        let counter = 1;
        let originalSlug = slug;
        
        // Ensure slug uniqueness within the store
        while (await Category.exists({ store: req.store._id, slug })) {
            slug = `${originalSlug}-${counter}`;
            counter++;
        }
        
        // Handle allowedProductTypes array
        let allowedProductTypes = [];
        if (req.body.allowedProductTypes) {
            if (Array.isArray(req.body.allowedProductTypes)) {
                allowedProductTypes = req.body.allowedProductTypes;
            } else if (typeof req.body.allowedProductTypes === 'string') {
                // Handle case where it might be sent as JSON string
                try {
                    allowedProductTypes = JSON.parse(req.body.allowedProductTypes);
                } catch (e) {
                    allowedProductTypes = [req.body.allowedProductTypes];
                }
            }
        }
        
        const categoryData = {
            name,
            slug,
            description,
            parent: parent || null,
            displayOrder: displayOrder || 0,
            isActive: isActive !== 'false',
            allowedProductTypes: allowedProductTypes.length > 0 ? allowedProductTypes : undefined,
            store: req.store._id
        };

        const category = new Category(categoryData);
        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
});

// Admin: Update a category
exports.updateCategory = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent, displayOrder, isActive } = req.body;
        
        const category = await Category.findOne({ 
            _id: id, 
            store: req.store._id 
        });
        
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const updateData = {
            name,
            description,
            parent: parent || null,
            displayOrder: displayOrder || 0,
            isActive: isActive !== 'false'
        };

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
});

// Admin: Delete a category
exports.deleteCategory = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findOne({ 
            _id: id, 
            store: req.store._id 
        });
        
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check if category has children
        const hasChildren = await Category.exists({ parent: id });
        if (hasChildren) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete category with subcategories. Please move or delete subcategories first.' 
            });
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
});

// Admin: Get category statistics
exports.getCategoryStats = asyncHandler(async (req, res) => {
    try {
        const storeId = req.store._id;
        
        const stats = await Category.aggregate([
            { $match: { store: mongoose.Types.ObjectId(storeId) } },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'products'
                }
            },
            {
                $project: {
                    name: 1,
                    slug: 1,
                    productCount: { $size: '$products' },
                    isActive: 1,
                    displayOrder: 1
                }
            },
            { $sort: { displayOrder: 1, name: 1 } }
        ]);
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching category stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category statistics',
            error: error.message
        });
    }
}); 