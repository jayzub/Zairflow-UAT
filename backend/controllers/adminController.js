require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/category');
const Vendor = require('../models/vendor');
const BaseProduct = require('../models/products/baseProduct');
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const { upload } = require('../config/multerConfig');
const { respondWithViewOrJson } = require('../helpers/respondWithViewOrJson');
const { asyncHandler } = require('../middleware/asyncHandler');
const sanitizeHtml = require('sanitize-html');
const cloudinary = require('../config/cloudinary');
const { sanitizeOptions } = require('../helpers/sanitizeOptions');
const { buildProductFilter, buildAggregationPipeline, serializeProducts, getPageRange, getProductTypes, fetchCategoriesAndVendors, parseField, isValidObjectId, resolveStoreId, productTypeModelMap, initProductFields, fetchProductWithRelated, parseUpdateFields, mergeImages, prepareUpdateData } = require('../helpers/productHelpers');
const { DEFAULT_LIMIT, DEFAULT_PAGE, DEFAULT_SORT, DEFAULT_ORDER } = require('../utils/constants');

// Admin: Get all products with admin-specific logic
exports.getAllProducts = asyncHandler(async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
        const page = parseInt(req.query.page, 10) || DEFAULT_PAGE;
        const sort = req.query.sort || DEFAULT_SORT;
        const order = req.query.order === 'asc' ? 1 : DEFAULT_ORDER;

        // Build filter with store isolation for admin
        const filter = buildProductFilter(req);

        // Check if this is an AJAX request
        const isAjaxRequest = req.xhr || 
            req.headers['x-requested-with'] === 'XMLHttpRequest' ||
            req.headers['accept'] === 'application/json';

        // Check Node cache (only for non-AJAX requests)
        const cacheKey = `admin_products:${JSON.stringify({ page, limit, sort, order, filter, isAjax: isAjaxRequest })}`;
        const cachedResult = myCache.get(cacheKey);

        if (cachedResult && !isAjaxRequest) {
            return respondWithViewOrJson(req, res, 'admin/products', cachedResult);
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        const aggregationPipeline = buildAggregationPipeline(filter, sort, order, skip, limit);

        // Add store filter to categories query - platform admins see all categories
        const categoryFilter = (!req.user.isPlatformAdmin && req.store) 
            ? { store: req.store._id, isActive: true } 
            : { isActive: true };

        const [productList, productCount, featuredProductsCount, categories] = await Promise.all([
            BaseProduct.aggregate(aggregationPipeline),
            BaseProduct.countDocuments(filter),
            BaseProduct.countDocuments({ ...filter, isFeatured: true }),
            Category.find(categoryFilter),
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(productCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // Serialize products
        const serializedProducts = serializeProducts(productList);

        const result = {
            pageTitle: 'Product List',
            products: serializedProducts,
            categories: categories.map(cat => cat.toObject()), // Convert to plain objects
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
            productCount,
            limit,
            featuredProductsCount,
            pageRange: getPageRange(page, totalPages),
            api: process.env.API_URL || '/api',
        };

        // Cache the result
        myCache.set(cacheKey, result);

        if (isAjaxRequest) {
            // Return JSON for AJAX requests (infinite scroll)
            // Set headers to prevent caching for AJAX requests
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            return res.json({
                success: true,
                products: serializedProducts,
                currentPage: page,
                totalPages,
                hasNextPage,
                hasPrevPage,
                productCount,
                api: process.env.API_URL || '/api'
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
        const productTypes = getProductTypes(BaseProduct);
        const { categories, vendors } = await fetchCategoriesAndVendors();
        res.render('admin/add-product', {
            pageTitle: 'Add Product',
            categories,
            vendors,
            productTypes
        });
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
        const { body } = req;
        const mongoose = require('mongoose');
        // Sanitize the description HTML
        if (body.description) {
            body.description = sanitizeHtml(body.description, sanitizeOptions);
        }

        // Parse fields
        const categories = body.category ? (Array.isArray(body.category) ? body.category : parseField(body.category)) : [];
        const tags = body.tags ? (Array.isArray(body.tags) ? body.tags : parseField(body.tags)) : [];
        const materialComposition = parseField(body.materialComposition);
        const care = parseField(body.care);
        const variants = parseField(body.variants);
        const materials = parseField(body.materials);
        const roomType = parseField(body.roomType);
        const specifications = parseField(body.specifications);
        const warranty = parseField(body.warranty);
        const dimensions = parseField(body.dimensions);
        const weight = parseField(body.weight);
        const assembly = parseField(body.assembly);

        // Validate vendor if provided
        if (body.vendor) {
            if (!isValidObjectId(body.vendor, mongoose)) {
                return res.status(400).json({ success: false, message: 'Invalid vendor ID' });
            }
            const vendorExists = await Vendor.findById(body.vendor);
            if (!vendorExists) {
                return res.status(404).json({ success: false, message: 'Vendor not found' });
            }
        }

        // Validate categories
        for (const categoryId of categories) {
            if (!isValidObjectId(categoryId, mongoose)) {
                return res.status(400).json({ success: false, message: `Invalid category ID ${categoryId}` });
            }
            const categoryExists = await Category.findById(categoryId);
            if (!categoryExists) {
                return res.status(404).json({ success: false, message: `Category not found ${categoryId}` });
            }
        }

        // Map uploaded files
        const images = req.files?.map(file => ({
            url: file.path,
            public_id: file.filename,
        })) || [];

        // Handle price fields with Decimal128
        const price = body.price 
            ? mongoose.Types.Decimal128.fromString(body.price.toString())
            : mongoose.Types.Decimal128.fromString('0');
        const salePrice = body.salePrice 
            ? mongoose.Types.Decimal128.fromString(body.salePrice.toString())
            : null;

        // Determine store from authenticated user or request
        const storeId = resolveStoreId(req, body);
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required. Please specify a store you have access to.'
            });
        }

        // Prepare base product data
        const productData = {
            store: storeId,
            name: body.name,
            description: body.description,
            category: categories,
            brand: body.brand,
            tags: tags,
            vendor: body.vendor,
            images: images,
            image: images[0] || {},
            price: price,
            salePrice: salePrice,
            countInStock: parseInt(body.countInStock) || 0,
            status: body.status || 'draft',
            isFeatured: body.isFeatured === 'true' || body.isFeatured === true
        };

        // Use mapping for product type models
        const ProductModel = productTypeModelMap[body.productType];
        if (!ProductModel) {
            return res.status(400).json({ success: false, message: 'Invalid product type' });
        }

        // Add type-specific fields
        let productSpecificData = {};
        switch (body.productType) {
            case 'Clothing':
                productSpecificData = {
                    material: body.material,
                    materialComposition: materialComposition || [],
                    care: care || [],
                    fit: body.fit,
                    season: body.season,
                    gender: body.gender,
                    variants: variants || []
                };
                break;
            case 'Electronics':
                productSpecificData = {
                    specifications: specifications,
                    warranty: warranty,
                    dimensions: dimensions,
                    weight: weight,
                    variants: variants || []
                };
                break;
            case 'Furniture':
                productSpecificData = {
                    dimensions: dimensions,
                    weight: weight,
                    materials: materials,
                    assembly: assembly,
                    style: body.style,
                    capacity: body.capacity,
                    roomType: roomType,
                    warranty: warranty,
                    variants: variants || []
                };
                break;
        }

        // Create and save the product
        const product = new ProductModel({ ...productData, ...productSpecificData });
        const savedProduct = await product.save();

        // Clear the products cache
        const cacheKeys = myCache.keys();
        cacheKeys.forEach(key => {
            if (key.startsWith('products:') || key.startsWith('admin_products:')) {
                myCache.del(key);
            }
        });

        // Return success response
        return res.status(201).json({
            success: true,
            data: savedProduct,
            message: 'Product created successfully!'
        });
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
        const mongoose = require('mongoose');
        if (!isValidObjectId(id, mongoose)) {
            return res.status(400).render('admin/error', {
                pageTitle: 'Error',
                message: 'Invalid Product ID',
                error: undefined
            });
        }
        const { product, categories, vendors } = await fetchProductWithRelated(id);
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

// Admin: Update product
exports.updateProduct = [
    upload.array('images', 5), // Handle multiple image uploads
    asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const mongoose = require('mongoose');
            if (!isValidObjectId(id, mongoose)) {
                return res.status(400).json({ success: false, message: 'Invalid Product ID' });
            }
            const product = await BaseProduct.findById(id);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            const { body } = req;
            // Sanitize the description HTML
            if (body.description) {
                body.description = sanitizeHtml(body.description, sanitizeOptions);
            }
            // Parse fields
            const parsed = parseUpdateFields(body);
            // Handle price fields with Decimal128
            const price = body.price 
                ? mongoose.Types.Decimal128.fromString(body.price.toString())
                : mongoose.Types.Decimal128.fromString('0');
            const salePrice = body.salePrice 
                ? mongoose.Types.Decimal128.fromString(body.salePrice.toString())
                : null;
            // Merge images
            const images = mergeImages(product.images, req.files);
            // Prepare update data
            const updateData = prepareUpdateData(body, parsed, images, price, salePrice);
            // Add type-specific fields
            switch (product.productType) {
                case 'Clothing':
                    Object.assign(updateData, {
                        material: body.material,
                        materialComposition: parsed.materialComposition || [],
                        care: parsed.care || [],
                        fit: body.fit,
                        season: body.season,
                        gender: body.gender,
                        variants: parsed.variants || []
                    });
                    break;
                case 'Electronics':
                    Object.assign(updateData, {
                        specifications: parsed.specifications,
                        warranty: parsed.warranty,
                        dimensions: parsed.dimensions,
                        weight: parsed.weight,
                        variants: parsed.variants || []
                    });
                    break;
                case 'Furniture':
                    Object.assign(updateData, {
                        dimensions: parsed.dimensions,
                        weight: parsed.weight,
                        materials: parsed.materials,
                        assembly: parsed.assembly,
                        style: body.style,
                        capacity: body.capacity,
                        roomType: parsed.roomType,
                        warranty: parsed.warranty,
                        variants: parsed.variants || []
                    });
                    break;
            }
            // Update the product
            const updatedProduct = await BaseProduct.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            // Clear the products cache
            const cacheKeys = myCache.keys();
            cacheKeys.forEach(key => {
                if (key.startsWith('products:') || key.startsWith('admin_products:')) {
                    myCache.del(key);
                }
            });
            res.status(200).json({
                success: true,
                data: updatedProduct,
                message: 'Product updated successfully!'
            });
        } catch (error) {
            console.error('Error in updateProduct:', error);
            return res.status(500).json({
                success: false,
                message: 'Error updating product',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    })
];

// Todo below this line

// Admin: Delete a product (Soft Delete)
exports.removeProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid Product ID' });
    }
    const deletedProduct = await BaseProduct.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deletedProduct) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product marked as deleted successfully' });
});

// Admin: Delete a product (hard delete)
exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await BaseProduct.findById(id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete image from Cloudinary (if needed)
    if (product.image && product.image.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
    }

    await BaseProduct.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
});

// Admin: Get product count
exports.getProductCount = asyncHandler(async (req, res) => {
    const count = await BaseProduct.countDocuments();
    res.status(200).json({ success: true, data: { count } });
}); 

// Admin: Get featured products
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
    const count = parseInt(req.params.count, 10) || 0;
    const products = await BaseProduct.find({ isFeatured: true }).limit(count);
    res.status(200).json({ success: true, data: products });
});

// Admin: Dashboard statistics
exports.getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Build filter for store isolation - platform admins see all, others see their store only
        let filter = { isActive: true };
        if (!req.user.isPlatformAdmin && req.store) {
            filter.store = req.store._id;
        }

        const [totalProducts, featuredProducts, lowStockProducts, totalCategories] = await Promise.all([
            BaseProduct.countDocuments(filter),
            BaseProduct.countDocuments({ ...filter, isFeatured: true }),
            BaseProduct.countDocuments({ ...filter, countInStock: { $lt: 10 } }),
            Category.countDocuments(!req.user.isPlatformAdmin && req.store ? { store: req.store._id } : {})
        ]);

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