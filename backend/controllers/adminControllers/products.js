require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../../models/category');
const Vendor = require('../../models/vendor');
const BaseProduct = require('../../models/products/baseProduct');
const storeCache = require('../../utils/cache');
const { upload } = require('../../config/multerConfig');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');
const { asyncHandler } = require('../../middleware/asyncHandler');
const sanitizeHtml = require('sanitize-html');
const cloudinary = require('../../config/cloudinary');
const { sanitizeOptions } = require('../../helpers/sanitizeOptions');
const { buildProductFilter, buildAggregationPipeline, serializeProducts, getPageRange, getProductTypes, fetchCategoriesAndVendors, parseField, isValidObjectId, resolveStoreId, productTypeModelMap, initProductFields, fetchProductWithRelated, parseUpdateFields, mergeImages, prepareUpdateData } = require('../../helpers/productHelpers');
const { DEFAULT_LIMIT, DEFAULT_PAGE, DEFAULT_SORT, DEFAULT_ORDER } = require('../../utils/constants');

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

        // Check Redis cache (only for non-AJAX requests)
        const cacheKey = `admin_products:${JSON.stringify({ page, limit, sort, order, filter, isAjax: isAjaxRequest })}`;
        const cachedResult = await storeCache.get(cacheKey);

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
        await storeCache.set(cacheKey, result);

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
        
        // Get store-specific categories and vendors
        const storeId = req.store?._id;
        const { categories, vendors } = await fetchCategoriesAndVendors(storeId);
        
        // Get allowed product types for this store
        const { getAllowedProductTypesForStore } = require('../../helpers/productHelpers');
        const allowedProductTypes = storeId ? await getAllowedProductTypesForStore(storeId) : productTypes;
        
        res.render('admin/add-product', {
            pageTitle: 'Add Product',
            categories,
            vendors,
            productTypes: allowedProductTypes, // Only show allowed types
            allProductTypes: productTypes // Keep all types for reference
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

        // Determine store from authenticated user or request
        const storeId = resolveStoreId(req, body);
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required. Please specify a store you have access to.'
            });
        }

        // Parse array/object fields that need special handling
        const categories = body.category ? (Array.isArray(body.category) ? body.category : parseField(body.category)) : [];
        const tags = body.tags ? (Array.isArray(body.tags) ? body.tags : parseField(body.tags)) : [];
        
        // Parse all fields that are type 'array', 'key_value_array', or 'object' from productTypes.js
        // Clothing fields
        const materialComposition = parseField(body.materialComposition);
        const care = parseField(body.care);
        
        // Common fields
        const variants = parseField(body.variants);
        
        // Furniture fields
        const materials = parseField(body.materials);
        const roomType = parseField(body.roomType);
        const isAssembly = parseField(body.isAssembly);  // object type
        
        // Electronics fields
        const specifications = parseField(body.specifications);
        const dimensions = parseField(body.dimensions);
        const weight = parseField(body.weight);  // object type (for Sports)
        
        // Food fields
        const nutritionalInfo = parseField(body.nutritionalInfo);
        
        // Books fields
        const genre = parseField(body.genre);
        
        // HealthBeauty fields
        const ingredients = parseField(body.ingredients);
        const allergens = parseField(body.allergens);
        const volume = parseField(body.volume);
        
        // Note: string, number, and date fields don't need parsing - they'll be read from body by createProductSpecificData

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

        // Validate product type is provided
        if (!body.productType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product type is required. Please select a product type.' 
            });
        }

        // Validate product type is valid
        const { getStoreProductTypes } = require('../../helpers/productHelpers');
        const validProductTypes = getStoreProductTypes();
        if (!validProductTypes.includes(body.productType)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}` 
            });
        }

        // Validate product type against store subscription
        const { validateProductTypeForStore } = require('../../helpers/productHelpers');
        const storeValidation = await validateProductTypeForStore(body.productType, storeId);
        if (!storeValidation.valid) {
            return res.status(400).json({ 
                success: false, 
                message: storeValidation.message 
            });
        }

        // Validate categories if provided
        if (categories && categories.length > 0) {
            for (const categoryId of categories) {
                if (!isValidObjectId(categoryId, mongoose)) {
                    return res.status(400).json({ success: false, message: `Invalid category ID ${categoryId}` });
                }
                const categoryExists = await Category.findById(categoryId);
                if (!categoryExists) {
                    return res.status(404).json({ success: false, message: `Category not found ${categoryId}` });
                }
            }

            // Validate category-product type compatibility
            const { validateProductCategoryCompatibility } = require('../../helpers/productHelpers');
            const compatibility = await validateProductCategoryCompatibility(body.productType, categories, storeId);
            if (!compatibility.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: compatibility.message 
                });
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

        // Prepare base product data
        const productData = {
            store: storeId,
            productType: body.productType, // Required product type
            name: body.name,
            description: body.description,
            category: categories, // Optional categories
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

        // Add type-specific fields dynamically
        const { createProductSpecificData } = require('../../helpers/productHelpers');
        
        // Create parsed data object with only the fields that need special parsing
        // These are array, key_value_array, and object types from productTypes.js
        const parsedData = {
            // Clothing
            materialComposition,  // key_value_array
            care,                 // array
            
            // Common
            variants,             // array
            
            // Furniture
            materials,            // array
            roomType,             // array
            isAssembly,             // object
            
            // Electronics
            specifications,       // key_value_array
            dimensions,           // key_value_array
            
            // Sports
            weight,               // object
            
            // Food
            nutritionalInfo,      // key_value_array
            ingredients,          // array
            allergens,            // array
            
            // Books
            genre,                // array
            
            // HealthBeauty
            volume                // array
        };
        
        // createProductSpecificData will:
        // - Read string/number/date fields from body (lines 445-448, 465-474 in productHelpers.js)
        // - Read array/object/key_value_array fields from parsedData (lines 450-476 in productHelpers.js)
        const productSpecificData = createProductSpecificData(body.productType, body, parsedData);

        // Create and save the product
        const product = new ProductModel({ ...productData, ...productSpecificData });
        const savedProduct = await product.save();

        // Clear the products cache
        const cacheKeys = await storeCache.keys();
        for (const key of cacheKeys) {
            if (key.startsWith('products:') || key.startsWith('admin_products:')) {
                await storeCache.del(key);
            }
        }

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
                        isAssembly: parsed.isAssembly,
                        style: body.style,
                        capacity: body.capacity,
                        roomType: parsed.roomType,
                        warranty: parsed.warranty,
                        variants: parsed.variants || []
                    });
                    break;
                case 'Books':
                    Object.assign(updateData, {
                        author: body.author,
                        publisher: body.publisher,
                        isbn: body.isbn,
                        language: body.language,
                        format: body.format,
                        genre: parsed.genre || [],
                        pages: body.pages,
                        publicationDate: body.publicationDate,
                        variants: parsed.variants || []
                    });
                    break;
                case 'Food':
                    Object.assign(updateData, {
                        brand: body.brand,
                        ingredients: parsed.ingredients || [],
                        nutritionalInfo: parsed.nutritionalInfo,
                        expiryDate: body.expiryDate,
                        allergens: parsed.allergens || [],
                        variants: parsed.variants || []
                    });
                    break;
                case 'Sports':
                    Object.assign(updateData, {
                        sport: body.sport,
                        skillLevel: body.skillLevel,
                        material: body.material,
                        weight: parsed.weight,
                        variants: parsed.variants || []
                    });
                    break;
                case 'HomeGarden':
                    Object.assign(updateData, {
                        room: body.room,
                        material: body.material,
                        dimensions: parsed.dimensions,
                        variants: parsed.variants || []
                    });
                    break;
                case 'HealthBeauty':
                    Object.assign(updateData, {
                        brand: body.brand,
                        skinType: body.skinType,
                        ingredients: parsed.ingredients || [],
                        volume: parsed.volume,
                        expiryDate: body.expiryDate,
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
            const cacheKeys = await storeCache.keys();
            for (const key of cacheKeys) {
                if (key.startsWith('products:') || key.startsWith('admin_products:')) {
                    await storeCache.del(key);
                }
            }
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