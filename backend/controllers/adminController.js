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

// HTML sanitization options
const sanitizeOptions = {
    allowedTags: [ 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'li', 'b', 'i', 'strong', 'em', 'strike', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td'
    ],
    allowedAttributes: {
        'a': [ 'href', 'target' ],
        'img': [ 'src', 'alt' ],
        '*': ['style']
    },
    allowedStyles: {
        '*': {
            'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
            'text-align': [/^left$/, /^right$/, /^center$/],
            'font-size': [/^\d+(?:px|em|%)$/]
        }
    }
};

// Admin: Get all products with admin-specific logic
exports.getAllProducts = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const sort = req.query.sort || 'dateCreated';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Build filter with store isolation for admin
    let filter = { isActive: true };
    
    // Platform admins can see all products, store owners/admins only see their store's products
    if (!req.user.isPlatformAdmin && req.store) {
        filter.store = req.store._id;
    }
    
    // Add category filter if provided
    if (req.query.categories) {
        filter.category = { $in: req.query.categories.split(',') };
    }

    // Add price range filter if provided
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

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

    const aggregationPipeline = [
        { $match: filter },
        { $sort: { [sort]: order, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category'
            }
        },
        {
            $lookup: {
                from: 'vendors',
                localField: 'vendor',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        {
            $unwind: {
                path: '$vendor',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                name: 1,
                price: 1,
                salePrice: 1,
                category: 1,
                image: 1,
                images: 1,
                vendor: 1,
                tags: 1,
                brand: 1,
                productType: 1,
                variants: 1,
                specifications: 1,
                dimensions: 1,
                weight: 1,
                materials: 1,
                assembly: 1,
                material: 1,
                materialComposition: 1,
                care: 1,
                fit: 1,
                season: 1,
                gender: 1,
                measurements: 1,
                dateCreated: 1,
                isFeatured: 1,
                countInStock: 1,
                status: 1
            }
        }
    ];

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

    // Convert MongoDB Decimal128 to string for price fields
    const serializedProducts = productList.map(product => ({
        ...product,
        price: product.price ? product.price.toString() : null,
        salePrice: product.salePrice ? product.salePrice.toString() : null,
        // Convert any other Decimal128 fields here
    }));

    // Helper to generate page range for pagination bar
    function getPageRange(current, total) {
        const delta = 2; // how many pages to show around current
        const range = [];
        const rangeWithDots = [];
        let l;
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }
        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l > 2) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }
        return rangeWithDots;
    }

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
        api: process.env.API_URL || '/api/v1',
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
            api: process.env.API_URL || '/api/v1'
        });
    } else {
        // Return full page for regular requests
        return respondWithViewOrJson(req, res, 'admin/products', result);
    }
});

// Admin: Render add-product page
exports.addProductPage = asyncHandler(async (req, res) => {

    // Get all available product types from discriminator models
    const productTypes = Object.keys(BaseProduct.discriminators || {})
        .map(type => ({
            value: type,
            label: type
        }));

    const [categories, vendors] = await Promise.all([
        Category.find().select('name _id'),
        Vendor.find().select('name _id')
    ]);

    res.render('admin/add-product', {
        pageTitle: 'Add Product',
        categories,
        vendors,
        productTypes
    });
});

// Admin: Create a new product
exports.createProduct = asyncHandler(async (req, res) => {
    try {
        const { body } = req;

        // Sanitize the description HTML
        if (body.description) {
            body.description = sanitizeHtml(body.description, sanitizeOptions);
        }

        // Helper to parse array or object fields
        function parseField(field) {
            if (!field) return undefined;
            if (typeof field === 'string') {
                try {
                    return JSON.parse(field);
                } catch (e) {
                    return field; // fallback if not JSON
                }
            }
            return field;
        }

        // Parse categories if provided
        let categories = [];
        if (body.category) {
            categories = Array.isArray(body.category)
                ? body.category
                : parseField(body.category);
        }

        // Parse tags if provided
        let tags = [];
        if (body.tags) {
            tags = Array.isArray(body.tags)
                ? body.tags
                : parseField(body.tags);
        }

        // Parse materialComposition, care, variants, materials, roomType, specifications, warranty, dimensions, weight, assembly
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
            if (!mongoose.isValidObjectId(body.vendor)) {
                return res.status(400).json({ success: false, message: 'Invalid vendor ID' });
            }
            const vendorExists = await Vendor.findById(body.vendor);
            if (!vendorExists) {
                return res.status(404).json({ success: false, message: 'Vendor not found' });
            }
        }

        // Validate categories
        for (const categoryId of categories) {
            if (!mongoose.isValidObjectId(categoryId)) {
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
        let storeId = req.store?._id;
        console.log('🔍 Debug - Initial storeId from req.store:', storeId);
        
        // Platform admins can create products for any store
        if (req.user.isPlatformAdmin) {
            if (body.storeId) {
                // Platform admin specified a store
                storeId = body.storeId;
            } else if (req.store) {
                // Use current store context
                storeId = req.store._id;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required for platform admin. Please specify a storeId in the request.'
                });
            }
        } else {
            // Store owners/admins can only create products for their own stores
            if (!storeId && req.user) {
                console.log('🔍 Debug - User owned stores:', req.user.ownedStores);
                console.log('🔍 Debug - User admin stores:', req.user.adminStores);
                
                if (req.user.ownedStores && req.user.ownedStores.length > 0) {
                    // Use the first owned store, or allow user to specify which store
                    storeId = req.user.ownedStores[0];
                    console.log('🔍 Debug - Using first owned store:', storeId);
                } else if (req.user.adminStores && req.user.adminStores.length > 0) {
                    // Use the first admin store if no owned stores
                    storeId = req.user.adminStores[0];
                    console.log('🔍 Debug - Using first admin store:', storeId);
                }
            }
            
            // If still no store, check if user specified a store in the request
            if (!storeId && body.storeId) {
                // Verify user has access to this store
                if (req.user && (
                    req.user.ownedStores.includes(body.storeId) || 
                    req.user.adminStores.includes(body.storeId)
                )) {
                    storeId = body.storeId;
                }
            }
        }
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required. Please specify a store you have access to.'
            });
        }
        
        console.log('🔍 Debug - Final storeId for product:', storeId);
        
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

        let product;
        
        // Create specific product type based on productType field
        switch (body.productType) {
            case 'Clothing':
                product = new (require('../models/products/clothing'))({
                    ...productData,
                    material: body.material,
                    materialComposition: materialComposition || [],
                    care: care || [],
                    fit: body.fit,
                    season: body.season,
                    gender: body.gender,
                    variants: variants || []
                });
                break;

            case 'Electronics':
                product = new (require('../models/products/electronics'))({
                    ...productData,
                    specifications: specifications,
                    warranty: warranty,
                    dimensions: dimensions,
                    weight: weight,
                    variants: variants || []
                });
                break;

            case 'Furniture':
                product = new (require('../models/products/furniture'))({
                    ...productData,
                    dimensions: dimensions,
                    weight: weight,
                    materials: materials,
                    assembly: assembly,
                    style: body.style,
                    capacity: body.capacity,
                    roomType: roomType,
                    warranty: warranty,
                    variants: variants || []
                });
                break;

            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid product type' 
                });
        }

        // Save the product
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
            error: error.message
        });
    }
});

// Admin: Render edit product page
exports.editProductPage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid Product ID' });
    }

    const [product, categories, vendors] = await Promise.all([
        BaseProduct.findById(id)
            .populate('category')
            .populate('vendor')
            .lean(), // Use lean() to get plain JavaScript objects
        Category.find().select('name _id'),
        Vendor.find().select('name _id')
    ]);

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Convert category and vendor to arrays if they're not already
    if (product.category && !Array.isArray(product.category)) {
        product.category = [product.category];
    }

    // Ensure all nested objects are properly initialized
    product.specifications = product.specifications || {};
    product.specifications.processor = product.specifications.processor || {};
    product.specifications.memory = product.specifications.memory || {};
    product.specifications.display = product.specifications.display || {};
    product.specifications.ports = product.specifications.ports || [];
    product.weight = product.weight || {};
    product.warranty = product.warranty || {};
    product.materialComposition = product.materialComposition || [];
    product.care = product.care || [];
    product.materials = product.materials || [];
    product.assembly = product.assembly || {};
    product.dimensions = product.dimensions || {};
    product.variants = product.variants || [];

    // Set the product type based on the discriminator
    product.productType = product.productType || 'BaseProduct';

    // Get all available product types from discriminator models
    const productTypes = Object.keys(BaseProduct.discriminators || {})
        .map(type => ({
            value: type,
            label: type
        }));

    // Debug log
    console.log('Product Type:', product.productType);
    console.log('Available Types:', productTypes);

    res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        product,
        categories,
        vendors,
        productTypes
    });
});

// Admin: Update product
exports.updateProduct = [
    upload.array('images', 5), // Handle multiple image uploads
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        if (!mongoose.isValidObjectId(id)) {
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

        // Helper to parse array or object fields
        function parseField(field) {
            if (!field) return undefined;
            if (typeof field === 'string') {
                try {
                    return JSON.parse(field);
                } catch (e) {
                    return field; // fallback if not JSON
                }
            }
            return field;
        }

        // Parse categories if provided
        let categories = [];
        if (body.category) {
            categories = Array.isArray(body.category)
                ? body.category
                : parseField(body.category);
        }

        // Parse tags if provided
        let tags = [];
        if (body.tags) {
            tags = Array.isArray(body.tags)
                ? body.tags
                : parseField(body.tags);
        }

        // Parse other fields
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

        // Handle price fields with Decimal128
        const price = body.price 
            ? mongoose.Types.Decimal128.fromString(body.price.toString())
            : mongoose.Types.Decimal128.fromString('0');
            
        const salePrice = body.salePrice 
            ? mongoose.Types.Decimal128.fromString(body.salePrice.toString())
            : null;

        // Handle new images if uploaded
        let images = product.images || [];
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: file.path,
                public_id: file.filename,
            }));
            images = [...images, ...newImages];
        }

        // Prepare update data
        const updateData = {
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

        // Add type-specific fields
        switch (product.productType) {
            case 'Clothing':
                Object.assign(updateData, {
                    material: body.material,
                    materialComposition: materialComposition || [],
                    care: care || [],
                    fit: body.fit,
                    season: body.season,
                    gender: body.gender,
                    variants: variants || []
                });
                break;

            case 'Electronics':
                Object.assign(updateData, {
                    specifications: specifications,
                    warranty: warranty,
                    dimensions: dimensions,
                    weight: weight,
                    variants: variants || []
                });
                break;

            case 'Furniture':
                Object.assign(updateData, {
                    dimensions: dimensions,
                    weight: weight,
                    materials: materials,
                    assembly: assembly,
                    style: body.style,
                    capacity: body.capacity,
                    roomType: roomType,
                    warranty: warranty,
                    variants: variants || []
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