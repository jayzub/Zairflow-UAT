require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/category');
const Vendor = require('../models/vendor');
const BaseProduct = require('../models/products/baseProduct');
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const { getRelatedProducts } = require('../helpers/productHelpers');
const { upload } = require('../config/multerConfig');
const Review = require('../models/reviews/review');
const { respondWithViewOrJson } = require('../helpers/respondWithViewOrJson');
const { asyncHandler } = require('../middleware/asyncHandler');
const sanitizeHtml = require('sanitize-html');

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

// Test endpoint for AJAX functionality
exports.testAjax = asyncHandler(async (req, res) => {
    console.log('Test AJAX endpoint called');
    console.log('Headers:', req.headers);
    
    const isAjaxRequest = req.xhr || 
                         req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                         req.headers['accept'] === 'application/json';
    
    if (isAjaxRequest) {
        return res.json({
            success: true,
            message: 'AJAX request detected successfully',
            headers: req.headers,
            isAjax: true
        });
    } else {
        return res.json({
            success: false,
            message: 'Not an AJAX request',
            headers: req.headers,
            isAjax: false
        });
    }
});

// Fetch all products with pagination
exports.getAllProducts = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) ||10;
    const page = parseInt(req.query.page, 10) || 1;
    const sort = req.query.sort || 'dateCreated';
    const order = req.query.order === 'asc' ? 1 : -1;
    const filter = req.query.categories
        ? { category: { $in: req.query.categories.split(',') } }
        : {};

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
    const cacheKey = `products:${JSON.stringify({ page, limit, sort, order, filter, isAjax: isAjaxRequest })}`;
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

    const [productList, productCount, featuredProductsCount, categories] = await Promise.all([
        BaseProduct.aggregate(aggregationPipeline),
        BaseProduct.countDocuments(filter),
        BaseProduct.countDocuments({ isFeatured: true }),
        Category.find(),
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


// Fetch product by ID
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await BaseProduct.findById(req.params.id)
        .populate('category')
        .populate('vendor')
        .populate({
            path: 'reviews',
            populate: {
                path: 'user',
                select: 'name avatar'
            }
        });
    
    if (!product) {
        return res.status(404).json({ 
            success: false, 
            message: 'Product not found' 
        });
    }

    // Convert the Mongoose document to a plain object early
    const productObj = product.toObject();

    // Check if product has a category before getting related products
    let relatedProducts = [];
    if (productObj.category?.length > 0) {
        relatedProducts = await getRelatedProducts(productObj._id, productObj.category[0]._id);
    }

    // Format prices
    const formattedPrice = productObj.price ? productObj.price.toString() : null;
    const formattedSalePrice = productObj.salePrice && parseFloat(productObj.salePrice.toString()) > 0 
        ? productObj.salePrice.toString() 
        : null;

    // Calculate discount percentage if there's a sale price
    let discountPercentage = null;
    if (productObj.salePrice && parseFloat(productObj.salePrice.toString()) > 0 && productObj.price) {
        const originalPrice = parseFloat(productObj.price.toString());
        const salePrice = parseFloat(productObj.salePrice.toString());
        discountPercentage = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    }

    // Prepare variants data (sizes, colors, etc.)
    let variants = productObj.variants || [];
    let availableSizes = [];
    let availableColors = [];

    // Extract unique sizes and colors if they exist in variants or base product
    if (variants && variants.length > 0) {
        availableSizes = [...new Set(variants.map(v => v.size))].filter(Boolean);
        availableColors = [...new Set(variants.map(v => v.color))].filter(Boolean);
    } else {
        // If no variants, check if the product has a base color
        if (productObj.color) {
            availableColors = [productObj.color];
        }
        if (productObj.size) {
            availableSizes = [productObj.size];
        }
    }

    // Prepare stock status
    const inStock = productObj.countInStock > 0;
    const stockStatus = inStock ? 'In stock' : 'Out of stock';
    const stockLevel = productObj.countInStock > 10 ? 'high' : productObj.countInStock > 5 ? 'medium' : 'low';

    // Prepare image gallery with variants
    const gallery = productObj.images.map(img => ({
        url: img.url,
        alt: productObj.name
    }));

    // If there are color variants, structure images for each color
    let colorVariantImages = {};
    if (productObj.variants && productObj.variants.length) {
        productObj.variants.forEach(variant => {
            if (variant.color && variant.images) {
                colorVariantImages[variant.color] = variant.images.map(img => img.url);
            }
        });
    } else {
        // If no variants, use main gallery for default display
        colorVariantImages['default'] = gallery.map(img => img.url);
    }

    // Prepare specifications sections based on product type
    let specificationSections = [];
    
    switch (productObj.productType) {
        case 'Electronics':
            if (productObj.specifications?.processor) {
                specificationSections.push({
                    title: 'Processor/Chipset',
                    specs: [
                        { label: 'Name', value: productObj.specifications.processor.name },
                        { label: 'Cores', value: productObj.specifications.processor.cores },
                        { label: 'Speed', value: productObj.specifications.processor.speed },
                        { label: 'Architecture', value: productObj.specifications.processor.architecture }
                    ].filter(spec => spec.value)
                });
            }

            if (productObj.specifications?.memory) {
                specificationSections.push({
                    title: 'Storage',
                    specs: [
                        { label: 'RAM', value: `${productObj.specifications.memory.ram} ${productObj.specifications.memory.ramUnit}` },
                        { label: 'Storage', value: `${productObj.specifications.memory.storage} ${productObj.specifications.memory.storageUnit}` },
                        { label: 'Storage Type', value: productObj.specifications.memory.storageType }
                    ].filter(spec => spec.value)
                });
            }

            if (productObj.specifications?.display) {
                specificationSections.push({
                    title: 'Display',
                    specs: [
                        { label: 'Size', value: `${productObj.specifications.display.size}"` },
                        { label: 'Resolution', value: productObj.specifications.display.resolution },
                        { label: 'Technology', value: productObj.specifications.display.technology },
                        { label: 'Refresh Rate', value: productObj.specifications.display.refreshRate ? `${productObj.specifications.display.refreshRate}Hz` : null },
                        { label: 'Brightness', value: productObj.specifications.display.brightness ? `${productObj.specifications.display.brightness} nits` : null },
                        { label: 'HDR', value: productObj.specifications.display.hdr ? 'Yes' : 'No' }
                    ].filter(spec => spec.value)
                });
            }

            if (productObj.specifications?.ports || productObj.specifications?.connectivity) {
                const connectivitySpecs = [];
                if (productObj.specifications.ports?.length) {
                    productObj.specifications.ports.forEach(port => {
                        connectivitySpecs.push({ label: port.type, value: `${port.quantity} ports` });
                    });
                }
                if (productObj.specifications.connectivity) {
                    if (productObj.specifications.connectivity.wifi) {
                        connectivitySpecs.push({ label: 'WiFi', value: productObj.specifications.connectivity.wifi });
                    }
                    if (productObj.specifications.connectivity.bluetooth) {
                        connectivitySpecs.push({ label: 'Bluetooth', value: productObj.specifications.connectivity.bluetooth });
                    }
                    if (productObj.specifications.connectivity.ethernet) {
                        connectivitySpecs.push({ label: 'Ethernet', value: 'Yes' });
                    }
                }
                if (connectivitySpecs.length) {
                    specificationSections.push({
                        title: 'Connectivity',
                        specs: connectivitySpecs
                    });
                }
            }

            if (productObj.dimensions || productObj.weight) {
                specificationSections.push({
                    title: 'Physical Specifications',
                    specs: [
                        { label: 'Length', value: productObj.dimensions?.length ? `${productObj.dimensions.length} ${productObj.dimensions.unit}` : null },
                        { label: 'Width', value: productObj.dimensions?.width ? `${productObj.dimensions.width} ${productObj.dimensions.unit}` : null },
                        { label: 'Height', value: productObj.dimensions?.height ? `${productObj.dimensions.height} ${productObj.dimensions.unit}` : null },
                        { label: 'Weight', value: productObj.weight?.value ? `${productObj.weight.value} ${productObj.weight.unit}` : null }
                    ].filter(spec => spec.value)
                });
            }

            if (productObj.warranty || productObj.powerConsumption) {
                specificationSections.push({
                    title: 'Power & Warranty',
                    specs: [
                        { label: 'Power Consumption', value: productObj.powerConsumption },
                        { label: 'Warranty Duration', value: productObj.warranty?.duration ? `${productObj.warranty.duration} months` : null },
                        { label: 'Warranty Type', value: productObj.warranty?.type },
                        { label: 'Coverage Details', value: productObj.warranty?.coverage }
                    ].filter(spec => spec.value)
                });
            }

            // Additional Details section for remaining fields
            const additionalSpecs = [
                { label: 'Model Number', value: productObj.modelNumber },
                { label: 'Color', value: productObj.color }
            ].filter(spec => spec.value);

            if (additionalSpecs.length) {
                specificationSections.push({
                    title: 'Additional Details',
                    specs: additionalSpecs
                });
            }
            break;

        case 'Furniture':
            if (productObj.dimensions) {
                specificationSections.push({
                    title: 'Dimensions',
                    specs: [
                        { label: 'Length', value: `${productObj.dimensions.length} ${productObj.dimensions.unit}` },
                        { label: 'Width', value: `${productObj.dimensions.width} ${productObj.dimensions.unit}` },
                        { label: 'Height', value: `${productObj.dimensions.height} ${productObj.dimensions.unit}` },
                        { label: 'Weight', value: productObj.weight ? `${productObj.weight.value} ${productObj.weight.unit}` : null }
                    ].filter(spec => spec.value)
                });
            }

            if (productObj.materials?.length) {
                specificationSections.push({
                    title: 'Materials',
                    specs: productObj.materials.map(material => ({
                        label: material.type,
                        value: material.description
                    }))
                });
            }

            if (productObj.assembly) {
                specificationSections.push({
                    title: 'Assembly',
                    specs: [
                        { label: 'Assembly Required', value: productObj.assembly.required ? 'Yes' : 'No' },
                        { label: 'Estimated Time', value: productObj.assembly.estimatedTime },
                        { label: 'Tools Included', value: productObj.assembly.toolsIncluded ? 'Yes' : 'No' }
                    ].filter(spec => spec.value)
                });
            }

            if (productObj.warranty) {
                specificationSections.push({
                    title: 'Warranty Information',
                    specs: [
                        { label: 'Duration', value: productObj.warranty.duration ? `${productObj.warranty.duration} months` : null },
                        { label: 'Coverage', value: productObj.warranty.coverage }
                    ].filter(spec => spec.value)
                });
            }

            if (productObj.roomType?.length || productObj.style || productObj.capacity || productObj.color) {
                specificationSections.push({
                    title: 'Additional Details',
                    specs: [
                        { label: 'Room Type', value: productObj.roomType?.join(', ') },
                        { label: 'Style', value: productObj.style },
                        { label: 'Capacity', value: productObj.capacity },
                        { label: 'Color', value: productObj.color }
                    ].filter(spec => spec.value)
                });
            }
            break;

        case 'Clothing':
            if (productObj.material || productObj.materialComposition?.length) {
                specificationSections.push({
                    title: 'Material & Care',
                    specs: [
                        { label: 'Material', value: productObj.material },
                        { label: 'Material Composition', value: productObj.materialComposition?.map(m => `${m.material} ${m.percentage}%`).join(', ') },
                        { label: 'Care Instructions', value: productObj.care?.join(', ') }
                    ].filter(spec => spec.value)
                });
            }

            if (productObj.measurements || productObj.fit) {
                specificationSections.push({
                    title: 'Fit & Size',
                    specs: [
                        { label: 'Fit', value: productObj.fit },
                        { label: 'Size Chart', value: productObj.measurements?.sizeChart },
                        { label: 'Fit Type', value: productObj.measurements?.fitType }
                    ].filter(spec => spec.value)
                });
            }

            specificationSections.push({
                title: 'Additional Details',
                specs: [
                    { label: 'Gender', value: productObj.gender },
                    { label: 'Season', value: productObj.season }
                ].filter(spec => spec.value)
            });
            break;
    }

    const data = {
        pageTitle: productObj.name,
        product: {
            ...productObj,
            formattedPrice,
            formattedSalePrice,
            discountPercentage,
            stockStatus,
            stockLevel,
            brand: productObj.brand,
            inStock,
            countInStock: productObj.countInStock || 0,
            gallery,
            colorVariantImages,
            specificationSections, // Add the new specifications sections
            availableSizes,
            availableColors,
            variants,
            reviews: productObj.reviews || [],
            rating: productObj.rating || 0,
            numReviews: productObj.numReviews || 0
        },
        relatedProducts: relatedProducts.length > 0 ? relatedProducts : null,
    };

    respondWithViewOrJson(req, res, 'landing/product-details', data);
});

// Fetch products by category
exports.getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    if (!mongoose.isValidObjectId(categoryId)) {
        return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const products = await BaseProduct.find({ category: categoryId });
    if (!products.length) {
        return res.status(404).json({ success: false, message: 'No products found for this category' });
    }

    res.status(200).json({ success: true, data: products });
});

// Render add-product page
exports.addProduct = asyncHandler(async (req, res) => {
    console.log('Starting addProduct controller...'); // Debug log

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

// Create a new product
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

        // Prepare base product data
        const productData = {
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
            if (key.startsWith('products:')) {
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

// Render edit product page
exports.editProduct = asyncHandler(async (req, res) => {
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

// Update product
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
            if (key.startsWith('products:')) {
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

// Delete a product (Soft Delete)
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

// Delete a product (hard delete)
// exports.deleteProduct = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const deletedProduct = await Product.findByIdAndDelete(id);
//     if (!deletedProduct) {
//         return res.status(404).json({ success: false, message: 'Product not found' });
//     }

//     res.status(200).json({ success: true, message: 'Product deleted successfully' });
// });

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


// Get product count
exports.getProductCount = asyncHandler(async (req, res) => {
    const count = await BaseProduct.countDocuments();
    res.status(200).json({ success: true, data: { count } });
}); 

// Get featured products
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
    const count = parseInt(req.params.count, 10) || 0;
    const products = await BaseProduct.find({ isFeatured: true }).limit(count);
    res.status(200).json({ success: true, data: products });
});

// Add new controller methods for reviews
exports.createReview = asyncHandler(async (req, res) => {
    const { rating, title, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user._id; // Assuming you have user auth middleware

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
        return res.status(400).json({ 
            success: false, 
            message: 'You have already reviewed this product' 
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create the review
        const review = await Review.create([{
            product: productId,
            user: userId,
            rating,
            title,
            comment
        }], { session });

        // Update product's reviews, numReviews, and rating
        const product = await BaseProduct.findById(productId).session(session);
        product.reviews.push(review[0]._id);
        product.numReviews += 1;
        
        // Calculate new average rating
        const allReviews = await Review.find({ product: productId }).session(session);
        const avgRating = allReviews.reduce((acc, item) => acc + item.rating, 0) / allReviews.length;
        product.rating = avgRating;

        await product.save();
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: review[0]
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

exports.deleteReview = asyncHandler(async (req, res) => {
    const { productId, reviewId } = req.params;
    const userId = req.user._id; // Assuming you have user auth middleware

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Delete the review
        const review = await Review.findOneAndDelete({
            _id: reviewId,
            product: productId,
            user: userId
        }).session(session);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Update product's reviews and rating
        const product = await BaseProduct.findById(productId).session(session);
        product.reviews = product.reviews.filter(r => r.toString() !== reviewId);
        product.numReviews -= 1;

        // Recalculate average rating
        const allReviews = await Review.find({ product: productId }).session(session);
        const avgRating = allReviews.length > 0
            ? allReviews.reduce((acc, item) => acc + item.rating, 0) / allReviews.length
            : 0;
        product.rating = avgRating;

        await product.save();
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

// Get products filter page (UI page)
exports.getProductsFilterPage = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 24;
    const page = parseInt(req.query.page, 10) || 1;
    const sort = req.query.sort || 'dateCreated';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Build filter based on query parameters
    const filter = {};
    
    // Category filter
    if (req.query.categories) {
        filter.category = { $in: req.query.categories.split(',') };
    }
    
    // Brand filter
    if (req.query.brands) {
        filter.brand = { $in: req.query.brands.split(',') };
    }
    
    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }
    
    // Stock filter
    if (req.query.stock) {
        const stockFilters = req.query.stock.split(',');
        if (stockFilters.includes('inStock')) {
            filter.countInStock = { $gt: 0 };
        } else if (stockFilters.includes('outOfStock')) {
            filter.countInStock = { $lte: 0 };
        }
    }
    
    // Rating filter
    if (req.query.rating) {
        const minRating = parseFloat(req.query.rating);
        filter.rating = { $gte: minRating };
    }
    
    // Product type filter
    if (req.query.productType) {
        filter.productType = { $in: req.query.productType.split(',') };
    }
    
    // Color filter
    if (req.query.colors) {
        const colors = req.query.colors.split(',');
        filter.$or = [
            { color: { $in: colors } },
            { 'variants.color': { $in: colors } }
        ];
    }
    
    // Featured products filter
    if (req.query.featured === 'true') {
        filter.isFeatured = true;
    }
    
    // Sale products filter
    if (req.query.onSale === 'true') {
        filter.salePrice = { $exists: true, $gt: 0 };
    }

    // Check if this is an AJAX request
    const isAjaxRequest = req.xhr || 
                         req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                         req.headers['accept'] === 'application/json';

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
                _id: 1,
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
                rating: 1,
                numReviews: 1,
                countInStock: 1,
                isFeatured: 1,
                color: 1,
                dateCreated: 1
            }
        }
    ];

    // Get total count for pagination
    const [productList, productCount, categories, brands] = await Promise.all([
        BaseProduct.aggregate(aggregationPipeline),
        BaseProduct.countDocuments(filter),
        Category.find().select('name _id'),
        BaseProduct.distinct('brand')
    ]);

    // Pagination info
    const totalPages = Math.ceil(productCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page >1

    // Helper to generate page range for pagination bar (same as admin)
    function getPageRange(current, total) {
        const delta = 2;
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

    // Transform products to match the expected format for the template
    const transformedProducts = productList.map(product => {
        // Calculate discount percentage
        let discountPercentage = null;
        if (product.salePrice && parseFloat(product.salePrice.toString()) > 0 && product.price) {
            const originalPrice = parseFloat(product.price.toString());
            const salePrice = parseFloat(product.salePrice.toString());
            discountPercentage = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
        }
        // Get available colors from variants or base product
        let availableColors = [];
        if (product.variants && product.variants.length > 0) {
            availableColors = [...new Set(product.variants.map(v => v.color))].filter(Boolean);
        } else if (product.color) {
            availableColors = [product.color];
        }
        // Get main image
        const mainImage = (product.image && product.image.url) ||
                          (product.images && product.images[0] && product.images[0].url) ||
                          '1.png';
        return {
            _id: product._id,
            image: mainImage,
            name: product.name,
            star: Math.round(product.rating || 0),
            rated: product.numReviews || 0,
            price: product.price ? product.price.toString() : '0.00',
            salePrice: product.salePrice && parseFloat(product.salePrice.toString()) > 0
                ? product.salePrice.toString() 
                : null,
            off: discountPercentage ? `${discountPercentage}%` : null,
            colors: availableColors.length,
            verified: product.isFeatured || false,
            wishListed: false, // This would be determined by user session
            extra: product.countInStock > 0 ? 'In stock' : 'Out of stock',
            extraClass: product.countInStock > 10 ? 'text-body-tertiary mb-2' : 'text-body-highlight fw-bold mb-2',
            dealEndTime: product.isFeatured ? 'Limited time' : null
        };
    });

    if (isAjaxRequest) {
        // Return JSON for AJAX requests (load more)
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        return res.json({
            success: true,
            products: transformedProducts,
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
            productCount,
            limit,
            currentFilters: {
                categories: req.query.categories ? req.query.categories.split(',') : [],
                brands: req.query.brands ? req.query.brands.split(',') : [],
                colors: req.query.colors ? req.query.colors.split(',') : [],
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                stock: req.query.stock ? req.query.stock.split(',') : [],
                rating: req.query.rating,
                productType: req.query.productType ? req.query.productType.split(',') : [],
                featured: req.query.featured === 'true',
                onSale: req.query.onSale === true
            },
            api: process.env.API_URL || '/api/v1'
        });
    }

    // Get unique colors for filter (only for full page requests)
    const colors = await BaseProduct.distinct('color');
    const variantColors = await BaseProduct.distinct('variants.color');
    const allColors = [...new Set([...colors, ...variantColors])].filter(Boolean);

    const result = {
        pageTitle: 'Products Filter',
        products: Array.isArray(transformedProducts) ? transformedProducts : [],
        categories: categories.map(cat => ({ name: cat.name, _id: cat._id })),
        brands: brands.filter(Boolean),
        colors: allColors,
        productCount,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        pageRange: getPageRange(page, totalPages),
        limit,
        currentFilters: {
            categories: req.query.categories ? req.query.categories.split(',') : [],
            brands: req.query.brands ? req.query.brands.split(',') : [],
            colors: req.query.colors ? req.query.colors.split(',') : [],
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            stock: req.query.stock ? req.query.stock.split(',') : [],
            rating: req.query.rating,
            productType: req.query.productType ? req.query.productType.split(',') : [],
            featured: req.query.featured === 'true',
            onSale: req.query.onSale === 'true'
        },
        api: process.env.API_URL || '/api/v1'
    };

    res.render('landing/products-filter', result);
});
