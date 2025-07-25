const BaseProduct = require('../models/products/baseProduct');

exports.getRelatedProducts = async (currentProductId, categoryId) => {
    try {
        if (!categoryId) return [];
        
        const relatedProducts = await BaseProduct.find({
            _id: { $ne: currentProductId },
            category: categoryId,
            status: 'published' // Only get published products
        })
        .select('name price images category') // Select only needed fields
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
    if (req.user.isPlatformAdmin) {
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
};

// Helper to fetch categories and vendors
exports.fetchCategoriesAndVendors = async () => {
    const Category = require('../models/category');
    const Vendor = require('../models/vendor');
    const [categories, vendors] = await Promise.all([
        Category.find().select('name _id'),
        Vendor.find().select('name _id')
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
        assembly: exports.parseField(body.assembly)
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
