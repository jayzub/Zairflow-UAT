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

// Helper to serialize products (convert Decimal128 to string)
exports.serializeProducts = (productList) => productList.map(product => ({
    ...product,
    price: product.price ? product.price.toString() : null,
    salePrice: product.salePrice ? product.salePrice.toString() : null,
}));

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
            if (req.user && (
                req.user.ownedStores.includes(body.storeId) ||
                req.user.adminStores.includes(body.storeId)
            )) {
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
    product.assembly = product.assembly || {};
    product.dimensions = product.dimensions || {};
    product.variants = product.variants || [];
    return product;
};

// Helper to fetch product with related data for editing
exports.fetchProductWithRelated = async (id) => {
    const BaseProduct = require('../models/products/baseProduct');
    const Category = require('../models/category');
    const Vendor = require('../models/vendor');
    const product = await BaseProduct.findById(id)
        .populate('category')
        .populate('vendor')
        .lean();
    const [categories, vendors] = await Promise.all([
        Category.find().select('name _id'),
        Vendor.find().select('name _id')
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
        assembly: exports.parseField(body.assembly),
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
exports.createProductSpecificData = (productType, body, parsed) => {
    const config = require('../config/productTypes').getProductTypeConfig(productType);
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
        productData.variants = parsed.variants;
    }
    
    return productData;
};

// Helper to validate product type against store subscription
exports.validateProductTypeForStore = async (productType, storeId) => {
    const Store = require('../models/store');
    const { getProductTypesForPlan } = require('../config/productTypes');
    
    try {
        const store = await Store.findById(storeId);
        if (!store) {
            return { valid: false, message: 'Store not found' };
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

// Helper to get allowed product types for a store
exports.getAllowedProductTypesForStore = async (storeId) => {
    const Store = require('../models/store');
    const { getProductTypesForPlan } = require('../config/productTypes');
    
    try {
        const store = await Store.findById(storeId);
        if (!store) {
            return [];
        }
        
        return getProductTypesForPlan(store.subscription.plan);
    } catch (error) {
        console.error('Error getting allowed product types:', error);
        return [];
    }
};
