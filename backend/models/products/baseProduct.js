const mongoose = require('mongoose');

const baseProductSchema = new mongoose.Schema({
    // Store isolation - every product belongs to a store
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: {
        url: { type: String },
        public_id: { type: String },
    },
    images: [{
        url: { type: String },
        public_id: { type: String },
    }],
    brand: { type: String, default: '' },
    tags: [{
        type: String,
        trim: true
    }],
    price: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    salePrice: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    // Product type is required - determines which specific fields are available
    productType: { 
        type: String, 
        required: true,
        enum: require('../../config/productTypes').getProductTypeNames(),
        index: true
    },
    // Categories are optional - can be assigned later
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    rating: { 
        type: Number, 
        min: 0, 
        max: 5, 
        default: 0,
        set: function(value) {
            if (this.numReviews > 0) {
                return parseFloat((value / this.numReviews).toFixed(1));
            }
            return 0;
        }
    },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    dateCreated: { type: Date, default: Date.now },
    countInStock: { type: Number, default: 0, min: 0, max: 255 },
    // SEO fields
    metaTitle: { type: String },
    metaDescription: { type: String },
    slug: { type: String, unique: true, sparse: true }
}, { 
    discriminatorKey: 'productType',
    toJSON: { virtuals: true },
    timestamps: true
});

// Pre-save middleware to generate slug if not provided
baseProductSchema.pre('save', async function(next) {
    if (!this.slug) {
        const slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        // Ensure slug is unique within the store
        let counter = 1;
        let uniqueSlug = slug;
        
        while (true) {
            const existing = await this.constructor.findOne({ 
                slug: uniqueSlug, 
                store: this.store,
                _id: { $ne: this._id }
            });
            
            if (!existing) {
                break;
            }
            
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        
        this.slug = uniqueSlug;
    }
    next();
});

// Pre-save middleware to validate category-product type compatibility and store limits
baseProductSchema.pre('save', async function(next) {
    try {
        // Validate product type against store subscription
        const Store = mongoose.model('Store');
        const store = await Store.findById(this.store);
        
        if (store) {
            // Use the centralized product type configuration instead of hardcoded limits
            const { getProductTypesForPlan } = require('../../config/productTypes');
            const allowedTypes = getProductTypesForPlan(store.subscription.plan);
            
            if (!allowedTypes.includes(this.productType)) {
                return next(new Error(
                    `Product type "${this.productType}" is not allowed in your current plan (${store.subscription.plan}). ` +
                    `Allowed types: ${allowedTypes.join(', ')}`
                ));
            }
        }
        
        // Validate category-product type compatibility
        if (this.category && this.category.length > 0) {
            const Category = mongoose.model('Category');
            
            // Check if all categories allow this product type
            const categories = await Category.find({
                _id: { $in: this.category },
                store: this.store
            });
            
            for (const category of categories) {
                if (!category.allowedProductTypes.includes(this.productType)) {
                    return next(new Error(
                        `Category "${category.name}" does not allow product type "${this.productType}". ` +
                        `Allowed types: ${category.allowedProductTypes.join(', ')}`
                    ));
                }
            }
        }
        
        next();
    } catch (error) {
        return next(error);
    }
});

// Virtuals
baseProductSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Indexes
baseProductSchema.index({ store: 1, productType: 1 });
baseProductSchema.index({ store: 1, isFeatured: 1 });
baseProductSchema.index({ store: 1, category: 1 });
baseProductSchema.index({ store: 1, brand: 1 });
baseProductSchema.index({ store: 1, isActive: 1 });
baseProductSchema.index({ store: 1, price: 1 });
baseProductSchema.index({ store: 1, rating: 1 });
baseProductSchema.index({ store: 1, dateCreated: -1 });
baseProductSchema.index({ name: 'text', description: 'text' });
baseProductSchema.index({ tags: 1 });
baseProductSchema.index({ slug: 1, store: 1 }, { unique: true, sparse: true });
// Compound indexes for common queries
baseProductSchema.index({ store: 1, isActive: 1, isFeatured: 1 });
baseProductSchema.index({ store: 1, productType: 1, isActive: 1 });
baseProductSchema.index({ store: 1, category: 1, isActive: 1 });

const BaseProduct = mongoose.model('Product', baseProductSchema);

module.exports = BaseProduct; 