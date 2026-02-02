const BaseProduct = require('../models/products/baseProduct');

exports.getRelatedProducts = async (currentProductId, categoryId, storeId = null) => {
    try {
        if (!categoryId) return [];
        
        // Build filter with store isolation
        const filter = {
            _id: { $ne: currentProductId },
            category: categoryId,
            isActive: true
        };
        
        if (storeId) {
            filter.store = storeId;
        }
        
        const relatedProducts = await BaseProduct.find(filter)
            .select('name price images category productType') // Select only needed fields
            .populate('category', 'name')
            .limit(8);

        return relatedProducts || [];
    } catch (error) {
        console.error('Error getting related products:', error.message);
        return [];
    }
};

/**
 * Fetch up to `limit` similar products for product-details page.
 *
 * Criteria:
 * - In stock only (countInStock > 0)
 * - Prefer same category (if provided), then fill with same productType
 * - Exclude the current product
 * - Keep results store-scoped when storeId is provided
 * - Order by closest price-range similarity (min/max) to target
 */
exports.getSimilarProducts = async ({
    currentProductId,
    categoryIds = [],
    productType,
    storeId = null,
    targetMinPrice = null,
    targetMaxPrice = null,
    limit = 10
}) => {
    try {
        const { calculatePriceRange } = exports;
        const seenIds = new Set([String(currentProductId)]);

        const baseFilter = {
            _id: { $ne: currentProductId },
            isActive: true,
            countInStock: { $gt: 0 }
        };
        if (storeId) baseFilter.store = storeId;

        const selectFields = 'name price salePrice images image category productType variants rating numReviews countInStock store';

        // 1) Same category (if available)
        let categoryProducts = [];
        const normalizedCategoryIds = Array.isArray(categoryIds) ? categoryIds.filter(Boolean) : [];
        if (normalizedCategoryIds.length > 0) {
            categoryProducts = await BaseProduct.find({
                ...baseFilter,
                category: { $in: normalizedCategoryIds }
            })
                .select(selectFields)
                .populate('category', 'name')
                .limit(limit * 2); // oversample; we'll sort by price similarity after
        }

        categoryProducts.forEach(p => seenIds.add(String(p._id)));

        // 2) Fill with same productType (category not required)
        let typeProducts = [];
        const remaining = Math.max(0, limit - categoryProducts.length);
        if (remaining > 0 && productType) {
            typeProducts = await BaseProduct.find({
                ...baseFilter,
                productType,
                _id: { $nin: Array.from(seenIds) }
            })
                .select(selectFields)
                .populate('category', 'name')
                .limit(limit * 3); // oversample; we'll sort
        }

        const candidates = [...categoryProducts, ...typeProducts];

        const targetMin = typeof targetMinPrice === 'number' && !Number.isNaN(targetMinPrice) ? targetMinPrice : null;
        const targetMax = typeof targetMaxPrice === 'number' && !Number.isNaN(targetMaxPrice) ? targetMaxPrice : targetMin;

        const scored = candidates.map(doc => {
            const obj = doc.toObject();
            const priceInfo = calculatePriceRange(obj);
            const minP = priceInfo.minPrice ? parseFloat(priceInfo.minPrice) : null;
            const maxP = priceInfo.maxPrice ? parseFloat(priceInfo.maxPrice) : minP;

            const score =
                targetMin !== null && minP !== null
                    ? Math.abs(minP - targetMin) + (targetMax !== null && maxP !== null ? Math.abs(maxP - targetMax) : 0)
                    : Number.POSITIVE_INFINITY;

            const mainImageUrl =
                obj.image?.url ||
                (Array.isArray(obj.images) && obj.images[0]?.url) ||
                null;

            return {
                ...obj,
                // Shape fields expected by `+Product(product)` card mixin
                image: mainImageUrl || '1.png',
                star: Math.round(obj.rating || 0),
                rated: obj.numReviews || 0,
                price: priceInfo.priceRange || priceInfo.minPrice || '0.00',
                salePrice: priceInfo.salePriceRange || priceInfo.minSalePrice || null,
                hasPriceRange: !!priceInfo.hasPriceRange,
                priceRange: priceInfo.priceRange || null,
                minPrice: priceInfo.minPrice || null,
                maxPrice: priceInfo.maxPrice || null,
                maxDiscountPercentage: priceInfo.maxDiscountPercentage !== null && priceInfo.maxDiscountPercentage !== undefined
                    ? priceInfo.maxDiscountPercentage
                    : null,
                colors: Array.isArray(obj.variants) ? new Set(obj.variants.map(v => v.color).filter(Boolean)).size : 0,
                _similarityScore: score
            };
        });

        // Order by closest price-range similarity, then stable by name/id
        scored.sort((a, b) => {
            if (a._similarityScore !== b._similarityScore) return a._similarityScore - b._similarityScore;
            const an = (a.name || '').toLowerCase();
            const bn = (b.name || '').toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return String(a._id).localeCompare(String(b._id));
        });

        return scored.slice(0, limit).map(p => {
            const { _similarityScore, ...rest } = p;
            return rest;
        });
    } catch (error) {
        console.error('Error getting similar products:', error.message);
        return [];
    }
};

// Helper to build product filter from request
exports.buildProductFilter = (req) => {
    let filter = { isActive: true };
    if (!req.user.isPlatformAdmin && req.store) {
        filter.store = req.store._id;
    }
    if (req.query.categories) {
        filter.category = { $in: req.query.categories.split(',') };
    }
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }
    return filter;
};

// Helper to build aggregation pipeline
exports.buildAggregationPipeline = (filter, sort, order, skip, limit) => [
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
            isAssembly: 1,
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

// Helper to serialize products (convert Decimal128 to string)
// Helper to calculate price range from product and variants
exports.calculatePriceRange = (product) => {
    const prices = [];
    const salePrices = [];
    
    // Add base product price (exclude 0 or less)
    if (product.price) {
        const basePrice = parseFloat(product.price.toString());
        if (!isNaN(basePrice) && basePrice > 0) {
            prices.push(basePrice);
        }
    }
    
    // Add base product sale price (exclude 0 or less, and only if less than regular price)
    if (product.salePrice) {
        const baseSalePrice = parseFloat(product.salePrice.toString());
        const basePrice = product.price ? parseFloat(product.price.toString()) : null;
        // Only include sale price if it's valid and less than regular price
        if (!isNaN(baseSalePrice) && baseSalePrice > 0) {
            // If there's a base price, only include sale price if it's less
            if (basePrice === null || baseSalePrice < basePrice) {
                salePrices.push(baseSalePrice);
            }
        }
    }
    
    // Add variant prices (exclude 0 or less)
    if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(variant => {
            if (variant.price) {
                const variantPrice = parseFloat(variant.price.toString());
                if (!isNaN(variantPrice) && variantPrice > 0) {
                    prices.push(variantPrice);
                }
            }
            if (variant.salePrice) {
                const variantSalePrice = parseFloat(variant.salePrice.toString());
                const variantPrice = variant.price ? parseFloat(variant.price.toString()) : null;
                // Only include sale price if it's valid and less than regular price
                if (!isNaN(variantSalePrice) && variantSalePrice > 0) {
                    // If there's a variant price, only include sale price if it's less
                    if (variantPrice === null || variantSalePrice < variantPrice) {
                        salePrices.push(variantSalePrice);
                    }
                }
            }
        });
    }
    
    // Calculate min and max
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
    const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
    const maxSalePrice = salePrices.length > 0 ? Math.max(...salePrices) : null;
    
    // Determine if there's a price range
    const hasPriceRange = minPrice !== null && maxPrice !== null && minPrice !== maxPrice;
    const hasSalePriceRange = minSalePrice !== null && maxSalePrice !== null && minSalePrice !== maxSalePrice;
    
    // Calculate maximum discount percentage from variants
    // This finds the variant with the highest discount percentage
    // Calculate if ANY variant or base product has a sale price
    let maxDiscountPercentage = null;
    let hasAnySalePrice = false;
    
    // Check variants for sale prices
    if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(variant => {
            if (variant.price && variant.salePrice) {
                const variantPrice = parseFloat(variant.price.toString());
                const variantSalePrice = parseFloat(variant.salePrice.toString());
                if (!isNaN(variantPrice) && !isNaN(variantSalePrice) && variantPrice > 0 && variantSalePrice > 0 && variantSalePrice < variantPrice) {
                    hasAnySalePrice = true;
                    const discount = Math.round(((variantPrice - variantSalePrice) / variantPrice) * 100);
                    if (maxDiscountPercentage === null || discount > maxDiscountPercentage) {
                        maxDiscountPercentage = discount;
                    }
                }
            }
        });
    }
    
    // Also check base product sale price
    if (product.price && product.salePrice) {
        const basePrice = parseFloat(product.price.toString());
        const baseSalePrice = parseFloat(product.salePrice.toString());
        if (!isNaN(basePrice) && !isNaN(baseSalePrice) && basePrice > 0 && baseSalePrice > 0 && baseSalePrice < basePrice) {
            hasAnySalePrice = true;
            const discount = Math.round(((basePrice - baseSalePrice) / basePrice) * 100);
            if (maxDiscountPercentage === null || discount > maxDiscountPercentage) {
                maxDiscountPercentage = discount;
            }
        }
    }
    
    // Only set maxDiscountPercentage if there's at least one sale price
    if (!hasAnySalePrice) {
        maxDiscountPercentage = null;
    }
    
    return {
        price: product.price ? product.price.toString() : null,
        salePrice: product.salePrice ? product.salePrice.toString() : null,
        minPrice: minPrice !== null ? minPrice.toFixed(2) : null,
        maxPrice: maxPrice !== null ? maxPrice.toFixed(2) : null,
        minSalePrice: minSalePrice !== null ? minSalePrice.toFixed(2) : null,
        maxSalePrice: maxSalePrice !== null ? maxSalePrice.toFixed(2) : null,
        hasPriceRange,
        hasSalePriceRange,
        priceRange: hasPriceRange ? `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}` : (minPrice !== null ? minPrice.toFixed(2) : null),
        salePriceRange: hasSalePriceRange ? `${minSalePrice.toFixed(2)} - ${maxSalePrice.toFixed(2)}` : (minSalePrice !== null ? minSalePrice.toFixed(2) : null),
        maxDiscountPercentage: maxDiscountPercentage !== null ? maxDiscountPercentage : null
    };
};

exports.serializeProducts = (productList) => productList.map(product => {
    const priceInfo = exports.calculatePriceRange(product);
    return {
        ...product,
        ...priceInfo
    };
});

// Helper to generate page range for pagination bar
exports.getPageRange = (current, total) => {
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
};

// Helper to get product types from BaseProduct discriminators
exports.getProductTypes = (BaseProduct) =>
    Object.keys(BaseProduct.discriminators || {}).map(type => ({ value: type, label: type }));

// Helper to parse a field (stringified array/object or already array/object)
exports.parseField = (field) => {
    if (!field) return undefined;
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch (e) {
            return field; // fallback if not JSON
        }
    }
    return field;
};

// Helper to convert variant prices to Decimal128 format
exports.convertVariantPrices = (variants) => {
    if (!variants || !Array.isArray(variants)) {
        return variants;
    }
    const mongoose = require('mongoose');
    return variants.map(variant => {
        const convertedVariant = { ...variant };
        if (variant.price !== undefined && variant.price !== null) {
            convertedVariant.price = mongoose.Types.Decimal128.fromString(variant.price.toString());
        }
        if (variant.salePrice !== undefined && variant.salePrice !== null) {
            convertedVariant.salePrice = mongoose.Types.Decimal128.fromString(variant.salePrice.toString());
        }
        return convertedVariant;
    });
};

// Helper to validate ObjectId
exports.isValidObjectId = (id, mongoose) => mongoose.isValidObjectId(id);

// Helper to resolve storeId for product creation
exports.resolveStoreId = (req, body) => {
    let storeId = req.store?._id;
    
    if (req.user?.isPlatformAdmin) {
        if (body.storeId) {
            storeId = body.storeId;
        } else if (req.store) {
            storeId = req.store._id;
        } else {
            return null;
        }
    } else {
        if (!storeId && req.user) {
            if (req.user.ownedStores && req.user.ownedStores.length > 0) {
                storeId = req.user.ownedStores[0];
            } else if (req.user.adminStores && req.user.adminStores.length > 0) {
                storeId = req.user.adminStores[0];
            }
        }
        if (!storeId && body.storeId) {
            const owned = (req.user?.ownedStores || []).map(String);
            const admin = (req.user?.adminStores || []).map(String);
            if (owned.includes(String(body.storeId)) || admin.includes(String(body.storeId))) {
                storeId = body.storeId;
            }
        }
    }
    
    return storeId;
};

// Helper to map product type to model
exports.productTypeModelMap = {
    Clothing: require('../models/products/clothing'),
    Electronics: require('../models/products/electronics'),
    Furniture: require('../models/products/furniture'),
    Books: require('../models/products/books'),
    Food: require('../models/products/food'),
    Sports: require('../models/products/sports'),
    HomeGarden: require('../models/products/homeGarden'),
    HealthBeauty: require('../models/products/healthBeauty'),
};

// Helper to fetch categories and vendors with store filtering
exports.fetchCategoriesAndVendors = async (storeId = null) => {
    const Category = require('../models/category');
    const Vendor = require('../models/vendor');
    
    // Build filters with store isolation
    const categoryFilter = storeId ? { store: storeId, isActive: true } : { isActive: true };
    const vendorFilter = storeId ? { store: storeId, isActive: true } : { isActive: true };
    
    const [categories, vendors] = await Promise.all([
        Category.find(categoryFilter).select('name _id allowedProductTypes'),
        Vendor.find(vendorFilter).select('name _id')
    ]);
    return { categories, vendors };
};

// Helper to initialize nested product fields
exports.initProductFields = (product) => {
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
    product.isAssembly = product.isAssembly || {};
    product.dimensions = product.dimensions || {};
    product.variants = product.variants || [];
    return product;
};

// Helper to fetch product with related data for editing
exports.fetchProductWithRelated = async (id, storeId = null) => {
    const BaseProduct = require('../models/products/baseProduct');
    const Category = require('../models/category');
    const Vendor = require('../models/vendor');
    const productQuery = storeId ? { _id: id, store: storeId } : { _id: id };
    const product = await BaseProduct.findOne(productQuery)
        .populate('category')
        .populate('vendor')
        .lean();
    const categoryFilter = storeId ? { store: storeId } : {};
    const vendorFilter = storeId ? { store: storeId } : {};
    const [categories, vendors] = await Promise.all([
        Category.find(categoryFilter).select('name _id'),
        Vendor.find(vendorFilter).select('name _id')
    ]);
    return { product, categories, vendors };
};

// Helper to parse update fields
exports.parseUpdateFields = (body) => {
    return {
        categories: body.category ? (Array.isArray(body.category) ? body.category : exports.parseField(body.category)) : [],
        tags: body.tags ? (Array.isArray(body.tags) ? body.tags : exports.parseField(body.tags)) : [],
        materialComposition: exports.parseField(body.materialComposition),
        care: exports.parseField(body.care),
        variants: exports.parseField(body.variants),
        materials: exports.parseField(body.materials),
        roomType: exports.parseField(body.roomType),
        specifications: exports.parseField(body.specifications),
        warranty: exports.parseField(body.warranty),
        dimensions: exports.parseField(body.dimensions),
        weight: exports.parseField(body.weight),
        isAssembly: exports.parseField(body.isAssembly),
        ingredients: exports.parseField(body.ingredients),
        nutritionalInfo: exports.parseField(body.nutritionalInfo),
        allergens: exports.parseField(body.allergens),
        volume: exports.parseField(body.volume),
        genre: exports.parseField(body.genre)
    };
};

// Helper to merge images
exports.mergeImages = (existingImages, newFiles) => {
    const newImages = newFiles?.map(file => ({
        url: file.path,
        public_id: file.filename,
    })) || [];
    return [...(existingImages || []), ...newImages];
};

// Helper to prepare update data
exports.prepareUpdateData = (body, parsed, images, price, salePrice) => {
    return {
        name: body.name,
        description: body.description,
        category: parsed.categories,
        brand: body.brand,
        tags: parsed.tags,
        vendor: body.vendor,
        images: images,
        image: images[0] || {},
        price: price,
        salePrice: salePrice,
        countInStock: parseInt(body.countInStock) || 0,
        status: body.status || 'draft',
        isFeatured: body.isFeatured === 'true' || body.isFeatured === true
    };
};

// Helper to validate product type and category compatibility
exports.validateProductCategoryCompatibility = async (productType, categoryIds, storeId) => {
    if (!categoryIds || categoryIds.length === 0) {
        return { valid: true, message: 'No categories assigned' };
    }
    
    const Category = require('../models/category');
    
    try {
        const categories = await Category.find({
            _id: { $in: categoryIds },
            store: storeId
        });
        
        const incompatibleCategories = categories.filter(
            category => !category.allowsProductType(productType)
        );
        
        if (incompatibleCategories.length > 0) {
            const categoryNames = incompatibleCategories.map(cat => cat.name).join(', ');
            return {
                valid: false,
                message: `Product type "${productType}" is not allowed in categories: ${categoryNames}`
            };
        }
        
        return { valid: true, message: 'All categories are compatible' };
    } catch (error) {
        return { valid: false, message: 'Error validating category compatibility' };
    }
};

// Helper to get compatible categories for a product type
exports.getCompatibleCategories = async (productType, storeId) => {
    const Category = require('../models/category');
    
    try {
        const categories = await Category.find({
            store: storeId,
            isActive: true,
            allowedProductTypes: productType
        }).select('name _id parent displayOrder');
        
        return categories;
    } catch (error) {
        console.error('Error fetching compatible categories:', error);
        return [];
    }
};

// Helper to get product types allowed by a category
exports.getCategoryProductTypes = async (categoryId, storeId) => {
    const Category = require('../models/category');
    
    try {
        const category = await Category.findOne({
            _id: categoryId,
            store: storeId
        });
        
        return category ? category.allowedProductTypes : [];
    } catch (error) {
        console.error('Error fetching category product types:', error);
        return [];
    }
};

// Helper to check if a product can be assigned to a category
exports.canAssignProductToCategory = async (productType, categoryId, storeId) => {
    const Category = require('../models/category');
    
    try {
        const category = await Category.findOne({
            _id: categoryId,
            store: storeId
        });
        
        return category ? category.allowsProductType(productType) : false;
    } catch (error) {
        console.error('Error checking category assignment:', error);
        return false;
    }
};

// Helper to get all product types available in a store
exports.getStoreProductTypes = () => {
    return require('../config/productTypes').getProductTypeNames();
};

// Helper to get product type specific fields
exports.getProductTypeFields = (productType) => {
    return require('../config/productTypes').getProductTypeFields(productType);
};

// Helper to get product type configuration
exports.getProductTypeConfig = (productType) => {
    return require('../config/productTypes').getProductTypeConfig(productType);
};

// Helper to get product types for a subscription plan
exports.getProductTypesForPlan = (plan) => {
    return require('../config/productTypes').getProductTypesForPlan(plan);
};

// Helper to validate product type specific data
exports.validateProductTypeData = (productType, data) => {
    const fields = exports.getProductTypeFields(productType);
    const errors = [];
    
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
        if (fieldConfig.required && !data[fieldName]) {
            errors.push(`${fieldName} is required for ${productType} products`);
        }
        
        if (data[fieldName] && fieldConfig.enum && !fieldConfig.enum.includes(data[fieldName])) {
            errors.push(`${fieldName} must be one of: ${fieldConfig.enum.join(', ')}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

// Helper to create product-specific data dynamically
exports.createProductSpecificData = async (productType, body, parsed, storeId) => {
    // First try to get predefined product type config
    let config = require('../config/productTypes').getProductTypeConfig(productType);
    
    // If not found, try to get custom product type config
    if (!config && storeId) {
        const { getProductTypeConfigWithCustom } = require('../config/productTypes');
        config = await getProductTypeConfigWithCustom(productType, storeId);
    }
    
    if (!config) {
        throw new Error(`Invalid product type: ${productType}`);
    }
    
    const productData = {};
    
    // Dynamically add fields based on configuration
    Object.keys(config.fields).forEach(fieldName => {
        const fieldConfig = config.fields[fieldName];
        
        switch (fieldConfig.type) {
            case 'string':
                if (body[fieldName]) {
                    productData[fieldName] = body[fieldName];
                }
                break;
            case 'array':
                if (parsed[fieldName]) {
                    productData[fieldName] = parsed[fieldName];
                }
                break;
            case 'key_value_array':
                if (parsed[fieldName]) {
                    productData[fieldName] = parsed[fieldName];
                }
                break;
            case 'object':
                if (parsed[fieldName]) {
                    productData[fieldName] = parsed[fieldName];
                }
                break;
            case 'number':
                if (body[fieldName]) {
                    productData[fieldName] = Number(body[fieldName]);
                }
                break;
            case 'date':
                if (body[fieldName]) {
                    productData[fieldName] = new Date(body[fieldName]);
                }
                break;
        }
    });
    
    // Add variants if they exist
    if (parsed.variants) {
        // Convert variant prices to Decimal128 format
        productData.variants = exports.convertVariantPrices(parsed.variants);
    }
    
    return productData;
};

// Helper to validate product type against store subscription
exports.validateProductTypeForStore = async (productType, storeId) => {
    const Store = require('../models/store');
    const { getProductTypesForPlan, getProductTypeConfigWithCustom } = require('../config/productTypes');
    const CustomProductType = require('../models/customProductType');
    
    try {
        const store = await Store.findById(storeId);
        if (!store) {
            return { valid: false, message: 'Store not found' };
        }
        
        // Check if this is a custom product type for this store
        const customType = await CustomProductType.getByNameAndStore(productType, storeId);
        if (customType) {
            // Custom product types are only allowed for premium plans and above
            const premiumPlans = ['premium', 'enterprise'];
            if (!premiumPlans.includes(store.subscription?.plan)) {
                return {
                    valid: false,
                    message: `Custom product types are only available for premium and enterprise plans. ` +
                            `Your current plan is: ${store.subscription?.plan || 'none'}`
                };
            }
            return { valid: true, message: 'Custom product type is allowed for this store' };
        }
        
        // Check if store has subscription info
        if (!store.subscription || !store.subscription.plan) {
            console.warn(`Store ${storeId} has no subscription plan, allowing all product types`);
            return { valid: true, message: 'Product type is allowed (no subscription restrictions)' };
        }
        
        const allowedTypes = getProductTypesForPlan(store.subscription.plan);
        
        if (!allowedTypes.includes(productType)) {
            return {
                valid: false,
                message: `Product type "${productType}" is not allowed in your current plan (${store.subscription.plan}). ` +
                        `Allowed types: ${allowedTypes.join(', ')}`
            };
        }
        
        return { valid: true, message: 'Product type is allowed for this store' };
    } catch (error) {
        console.error('Error validating product type for store:', error);
        return { valid: false, message: 'Error validating product type' };
    }
};

// Helper to get allowed product types for a store (including custom product types for premium+ plans)
exports.getAllowedProductTypesForStore = async (storeId) => {
    const Store = require('../models/store');
    const { getProductTypesForPlanWithCustom } = require('../config/productTypes');
    
    try {
        const store = await Store.findById(storeId);
        if (!store) {
            console.warn(`Store ${storeId} not found`);
            return [];
        }
        
        // Ensure subscription object exists
        if (!store.subscription) {
            console.warn(`Store ${storeId} has no subscription object, initializing with 'free' plan`);
            store.subscription = {
                plan: 'free',
                startDate: new Date(),
                features: []
            };
            await store.save();
        }
        
        const plan = store.subscription.plan || 'free';
        console.log(`Getting product types for store ${storeId} (${store.name}), plan: ${plan}`);
        console.log(`Store subscription object:`, JSON.stringify(store.subscription, null, 2));
        
        // Get product types for the plan including custom types (for premium+ plans)
        const productTypes = await getProductTypesForPlanWithCustom(plan, storeId);
        console.log(`Found ${productTypes.length} product types for store ${storeId}:`, productTypes);
        
        return productTypes;
    } catch (error) {
        console.error('Error getting allowed product types:', error);
        return [];
    }
};
