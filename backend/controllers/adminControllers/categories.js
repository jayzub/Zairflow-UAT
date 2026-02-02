const { asyncHandler } = require('../../middleware/asyncHandler');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');
const adminCategoriesService = require('../../services/admin/adminCategoriesService');

// Admin: Get all categories for a store
exports.getAllCategories = asyncHandler(async (req, res) => {
    try {
        const categories = await adminCategoriesService.listCategoriesForStore(req.store._id);
        
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
        const categories = await adminCategoriesService.listCategoriesForParentSelection(req.store._id);
        
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
        const category = await adminCategoriesService.getCategoryForEdit({
            storeId: req.store._id,
            categoryId: req.params.id,
        });
        
        if (!category) {
            return res.status(404).render('admin/error', { error: 'Category not found' });
        }
        
        // Fetch all categories for parent selection
        const categories = await adminCategoriesService.listCategoriesForParentSelection(req.store._id);
        
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
        if (process.env.NODE_ENV === 'development') {
            console.log('Request body:', req.body);
            console.log('Request headers:', req.headers);
        }

        const result = await adminCategoriesService.createCategory({
            storeId: req.store._id,
            body: req.body,
        });

        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({
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
        const updated = await adminCategoriesService.updateCategory({
            storeId: req.store._id,
            categoryId: id,
            body: req.body,
        });

        if (!updated.ok && updated.reason === 'not_found') {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: updated.category
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
        const deleted = await adminCategoriesService.deleteCategory({
            storeId: req.store._id,
            categoryId: id,
        });

        if (!deleted.ok && deleted.reason === 'not_found') {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        if (!deleted.ok && deleted.reason === 'has_children') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete category with subcategories. Please move or delete subcategories first.' 
            });
        }

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
        const stats = await adminCategoriesService.getCategoryStats(req.store._id);
        
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

// Admin: Get compatible categories for a product type
exports.getCompatibleCategories = asyncHandler(async (req, res) => {
    try {
        const { productType } = req.query;
        const storeId = req.store._id;
        
        if (!productType) {
            return res.status(400).json({
                success: false,
                message: 'Product type is required'
            });
        }
        
        // Use the helper function to get compatible categories
        const { getCompatibleCategories } = require('../../helpers/productHelpers');
        const categories = await getCompatibleCategories(productType, storeId);
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching compatible categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching compatible categories',
            error: error.message
        });
    }
}); 