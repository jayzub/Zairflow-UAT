require('dotenv').config();
const mongoose = require('mongoose');
const BaseProduct = require('../../models/products/baseProduct');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');
const { asyncHandler } = require('../../middleware/asyncHandler');
const adminProductsService = require('../../services/admin/adminProductsService');
const { getProductTypes, initProductFields } = require('../../helpers/productHelpers');
const { DEFAULT_LIMIT, DEFAULT_PAGE, DEFAULT_SORT, DEFAULT_ORDER } = require('../../utils/constants');

// Admin: Get soft-deleted products page
exports.getDeletedProductsPage = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
    const page = parseInt(req.query.page, 10) || DEFAULT_PAGE;
    const sort = req.query.sort || DEFAULT_SORT;
    const order = req.query.order === 'asc' ? 1 : DEFAULT_ORDER;

    const { ok, result } = await adminProductsService.listDeletedProducts({ req, limit, page, sort, order });
    if (!ok) {
        return res.status(500).render('admin/error', {
            pageTitle: 'Error',
            message: 'Failed to load removed products',
        });
    }
    return res.render('admin/products-deleted', result);
});

// Admin: Get all products with admin-specific logic
exports.getAllProducts = asyncHandler(async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
        const page = parseInt(req.query.page, 10) || DEFAULT_PAGE;
        const sort = req.query.sort || DEFAULT_SORT;
        const order = req.query.order === 'asc' ? 1 : DEFAULT_ORDER;

        const { ok, isAjax, result } = await adminProductsService.listProducts({ req, limit, page, sort, order });

        if (!ok) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching products',
                error: process.env.NODE_ENV === 'development' ? 'Failed to list products' : 'Internal server error'
            });
        }

        if (isAjax) {
            // Return JSON for AJAX requests (infinite scroll)
            // Set headers to prevent caching for AJAX requests
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            return res.json({
                success: true,
                products: result.products,
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage,
                productCount: result.productCount,
                api: result.api
            });
        } else {
            // Return full page for regular requests
            return respondWithViewOrJson(req, res, 'admin/products', result);
        }
    } catch (error) {
        console.error('Error in getAllProducts:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Admin: Render add-product page
exports.addProductPage = asyncHandler(async (req, res) => {
    try {
        const storeId = req.store?._id;
        const data = await adminProductsService.getAddProductPageData({ storeId });
        res.render('admin/add-product', data);
    } catch (error) {
        console.error('Error rendering add product page:', error);
        res.status(500).render('admin/error', {
            pageTitle: 'Error',
            message: 'Failed to load add product page',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin: Create a new product
exports.createProduct = asyncHandler(async (req, res) => {
    try {
        const result = await adminProductsService.createProduct({ req });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error in createProduct:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Admin: Render edit product page
exports.editProductPage = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).render('admin/error', {
                pageTitle: 'Error',
                message: 'Invalid Product ID',
                error: undefined
            });
        }
        const { product, categories, vendors } = await adminProductsService.getEditProductPageData({ req, productId: id });
        if (!product) {
            return res.status(404).render('admin/error', {
                pageTitle: 'Error',
                message: 'Product not found',
                error: undefined
            });
        }
        // Initialize nested fields
        initProductFields(product);
        // Set the product type based on the discriminator
        product.productType = product.productType || 'BaseProduct';
        // Get all available product types from discriminator models
        const productTypes = getProductTypes(BaseProduct);
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            product,
            categories,
            vendors,
            productTypes
        });
    } catch (error) {
        console.error('Error rendering edit product page:', error);
        res.status(500).render('admin/error', {
            pageTitle: 'Error',
            message: 'Failed to load edit product page',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin: Update product (multer is applied in the route, do not duplicate here or the body stream is consumed twice → "Unexpected end of form")
exports.updateProduct = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminProductsService.updateProduct({ req, productId: id });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error in updateProduct:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Admin: Delete a product (Soft Delete)
exports.removeProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminProductsService.removeProductSoft({ req, productId: id });
    return res.status(result.status).json(result.payload);
});

// Admin: Restore a soft-deleted product
exports.restoreProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminProductsService.restoreProductSoft({ req, productId: id });
    return res.status(result.status).json(result.payload);
});

// Admin: Delete a product (hard delete)
exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminProductsService.deleteProductHard({ req, productId: id });
    return res.status(result.status).json(result.payload);
});

// Admin: Get product count
exports.getProductCount = asyncHandler(async (req, res) => {
    const result = await adminProductsService.getProductCount({ req });
    return res.status(result.status).json(result.payload);
}); 

// Admin: Get featured products
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const count = parseInt(req.params.count, 10) || 0;
  const result = await adminProductsService.getFeaturedProducts({ req, count });
  return res.status(result.status).json(result.payload);
});

// Admin: Render import products page
exports.importProductsPage = asyncHandler(async (req, res) => {
  try {
    const importLimits = require('../../config/importLimits');
    res.render('admin/products-import', {
      pageTitle: 'Import Products',
      adminUrl: 'admin',
      importMaxSize: importLimits.MAX_CSV_IMPORT_SIZE_LABEL,
      importMaxRows: importLimits.MAX_CSV_IMPORT_ROWS,
    });
  } catch (error) {
    console.error('Error rendering import page:', error);
    res.status(500).render('admin/error', {
      pageTitle: 'Error',
      message: 'Failed to load import page',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Admin: Download CSV import template
exports.downloadImportTemplate = asyncHandler(async (req, res) => {
  const csv = [
    'name,description,productType,price,salePrice,countInStock,brand,tags,category,vendor,variants',
    '"Blue T-Shirt","Cotton t-shirt in blue","Clothing",29.99,24.99,,Acme,"summer|cotton|casual",,,"S:Blue:34.99:28.99:TSH-BL-S:10||M:Blue:29.99::TSH-BL-M:15"',
    '"Wireless Mouse","Ergonomic wireless mouse","Electronics",49.99,,50,TechCo,"office|wireless",,,',
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.csv"');
  res.send(csv);
});

// Admin: Bulk import products from CSV
exports.bulkImportProducts = asyncHandler(async (req, res) => {
  try {
    const result = await adminProductsService.bulkImportProducts({ req, file: req.file });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Error in bulkImportProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error importing products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});