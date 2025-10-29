require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/category');
const Vendor = require('../models/vendor');
const BaseProduct = require('../models/products/baseProduct');
const storeCache = require('../utils/cache');
const { getRelatedProducts } = require('../helpers/productHelpers');
const { upload } = require('../config/multerConfig');
const Review = require('../models/review');
const { respondWithViewOrJson } = require('../helpers/respondWithViewOrJson');
const { asyncHandler } = require('../middleware/asyncHandler');
// const sanitizeHtml = require('sanitize-html');
const { sanitizeOptions } = require('../helpers/sanitizeOptions');


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

// Fetch product by ID
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await BaseProduct.findById(req.params.id)
        .populate('category')
        .populate('vendor')
        .populate({
            path: 'reviews',
            populate: {
                path: 'customer',
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

    // Helper function to generate specifications sections
    function generateSpecificationSections(productObj) {
        const sections = [];
        
        // Generic key-value array handler
        function addKeyValueSection(title, fieldName, productObj) {
            if (productObj[fieldName]?.length) {
                sections.push({
                    title: title,
                    specs: productObj[fieldName].map(item => {
                        const key = Object.keys(item)[0];
                        const value = item[key];
                        return { label: key, value: value };
                    })
                });
            }
        }
        
        // Generic field handler
        function addFieldSection(title, fields, productObj) {
            const specs = fields.map(field => {
                if (typeof field === 'string') {
                    return { label: field, value: productObj[field] };
                } else if (typeof field === 'object') {
                    const { field: fieldName, label, formatter } = field;
                    let value = productObj[fieldName];
                    if (formatter && value) {
                        value = formatter(value);
                    }
                    return { label: label || fieldName, value: value };
                }
            }).filter(spec => spec.value);
            
            if (specs.length > 0) {
                sections.push({ title, specs });
            }
        }
        
        // Product type specific logic
        switch (productObj.productType) {
            case 'Electronics':
                addKeyValueSection('Specifications', 'specifications', productObj);
                addKeyValueSection('Dimensions', 'dimensions', productObj);
                addFieldSection('Additional Details', ['modelNumber', 'weight', 'warranty'], productObj);
                break;
                
            case 'Furniture':
                addKeyValueSection('Dimensions', 'dimensions', productObj);
                addFieldSection('Materials', [
                    { field: 'material', label: 'Material', formatter: material => material?.join(', ') }
                ], productObj);
                addFieldSection('Room Type', ['roomType'], productObj);
                addFieldSection('Additional Details', ['style', 'weight', 'assembly', 'warranty'], productObj);
                break;
                
            case 'Clothing':
                addFieldSection('Material & Care', [
                    'material',
                    { field: 'materialComposition', label: 'Material Composition', formatter: mc => 
                        mc?.map(m => {
                            const key = Object.keys(m)[0];
                            const value = m[key];
                            return `${key}: ${value}`;
                        }).join(', ') },
                    { field: 'care', label: 'Care Instructions', formatter: care => care?.join(', ') }
                ], productObj);
                addFieldSection('Fit & Style', ['fit', 'gender', 'season'], productObj);
                break;
                
            case 'Food':
                addKeyValueSection('Nutritional Information', 'nutritionalInfo', productObj);
                addFieldSection('Food Details', [
                    'brand',
                    { field: 'ingredients', label: 'Ingredients', formatter: ing => ing?.join(', ') },
                    { field: 'expiryDate', label: 'Expiry Date', formatter: date => date ? new Date(date).toLocaleDateString() : null },
                    { field: 'allergens', label: 'Allergens', formatter: all => all?.join(', ') }
                ], productObj);
                break;
                
            case 'HomeGarden':
                addKeyValueSection('Dimensions', 'dimensions', productObj);
                addFieldSection('Details', ['room', 'material'], productObj);
                break;
                
            case 'Books':
                addFieldSection('Book Details', [
                    'author',
                    'publisher',
                    'isbn',
                    'language',
                    'format',
                    'pages',
                    { field: 'publicationDate', label: 'Publication Date', formatter: date => date ? new Date(date).toLocaleDateString() : null },
                    { field: 'genre', label: 'Genre', formatter: genre => genre?.join(', ') }
                ], productObj);
                break;
                
            case 'Sports':
                addFieldSection('Sports Details', [
                    'sport',
                    'skillLevel',
                    'material',
                    { field: 'weight', label: 'Weight', formatter: w => w?.value ? `${w.value} ${w.unit}` : null }
                ], productObj);
                break;
                
            case 'HealthBeauty':
                addFieldSection('Product Details', [
                    'brand',
                    'skinType',
                    { field: 'ingredients', label: 'Ingredients', formatter: ing => ing?.join(', ') },
                    { field: 'volume', label: 'Volume', formatter: v => v?.value ? `${v.value} ${v.unit}` : null },
                    { field: 'expiryDate', label: 'Expiry Date', formatter: date => date ? new Date(date).toLocaleDateString() : null }
                ], productObj);
                break;
        }
        
        return sections;
    }

    // Generate specifications sections
    const specificationSections = generateSpecificationSections(productObj);
    

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

// Get products for a specific store
exports.getStoreProducts = asyncHandler(async (req, res) => {
    const { storeSlug } = req.params;
    const limit = parseInt(req.query.limit, 10) || 24;
    const page = parseInt(req.query.page, 10) || 1;
    const sort = req.query.sort || 'dateCreated';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // First, find the store
    const Store = require('../models/store');
    const store = await Store.findOne({ slug: storeSlug, isActive: true });
    
    if (!store) {
        return res.status(404).json({ 
            success: false, 
            message: 'Store not found' 
        });
    }
    
    // Build filter based on query parameters
    const filter = { store: store._id };
    
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
        Category.find({ store: store._id }).select('name _id'),
        BaseProduct.distinct('brand', { store: store._id })
    ]);

    // Pagination info
    const totalPages = Math.ceil(productCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Helper to generate page range for pagination bar
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
            store: {
                name: store.name,
                slug: store.slug,
                description: store.description
            },
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
            api: process.env.API_URL || '/api'
        });
    }

    // Get unique colors for filter (only for full page requests)
    const colors = await BaseProduct.distinct('color', { store: store._id });
    const variantColors = await BaseProduct.distinct('variants.color', { store: store._id });
    const allColors = [...new Set([...colors, ...variantColors])].filter(Boolean);

    const result = {
        pageTitle: `${store.name} - Products`,
        store: {
            name: store.name,
            slug: store.slug,
            description: store.description,
            logo: store.logo,
            banner: store.banner
        },
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
        api: process.env.API_URL || '/api'
    };

    res.render('landing/store-products', result);
});

// Get all products across all stores (marketplace view)
exports.getAllProductsMarketplace = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 24;
    const page = parseInt(req.query.page, 10) || 1;
    const sort = req.query.sort || 'dateCreated';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Build filter based on query parameters
    const filter = { isActive: true }; // Only active products
    
    // Store filter
    if (req.query.stores) {
        const Store = require('../models/store');
        const storeSlugs = req.query.stores.split(',');
        const stores = await Store.find({ slug: { $in: storeSlugs }, isActive: true });
        const storeIds = stores.map(store => store._id);
        filter.store = { $in: storeIds };
    }
    
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
            $lookup: {
                from: 'stores',
                localField: 'store',
                foreignField: '_id',
                as: 'store'
            }
        },
        {
            $unwind: {
                path: '$vendor',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: '$store',
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
                store: 1,
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
    const [productList, productCount, categories, brands, stores] = await Promise.all([
        BaseProduct.aggregate(aggregationPipeline),
        BaseProduct.countDocuments(filter),
        Category.find().select('name _id'),
        BaseProduct.distinct('brand'),
        require('../models/store').find({ isActive: true }).select('name slug')
    ]);

    // Pagination info
    const totalPages = Math.ceil(productCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Helper to generate page range for pagination bar
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
            dealEndTime: product.isFeatured ? 'Limited time' : null,
            store: product.store ? {
                name: product.store.name,
                slug: product.store.slug
            } : null
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
                stores: req.query.stores ? req.query.stores.split(',') : [],
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
            api: process.env.API_URL || '/api'
        });
    }

    // Get unique colors for filter (only for full page requests)
    const colors = await BaseProduct.distinct('color');
    const variantColors = await BaseProduct.distinct('variants.color');
    const allColors = [...new Set([...colors, ...variantColors])].filter(Boolean);

    const result = {
        pageTitle: 'Marketplace - All Products',
        products: Array.isArray(transformedProducts) ? transformedProducts : [],
        categories: categories.map(cat => ({ name: cat.name, _id: cat._id })),
        brands: brands.filter(Boolean),
        stores: stores.map(store => ({ name: store.name, slug: store.slug })),
        colors: allColors,
        productCount,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        pageRange: getPageRange(page, totalPages),
        limit,
        currentFilters: {
            stores: req.query.stores ? req.query.stores.split(',') : [],
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
        api: process.env.API_URL || '/api'
    };

    res.render('landing/marketplace-products', result);
});
