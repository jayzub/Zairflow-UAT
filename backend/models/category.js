const mongoose = require('mongoose');

// Schema for defining which attributes are required/available for this category
const categoryAttributeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['string', 'number', 'boolean', 'date', 'object', 'array'],
        default: 'string'
    },
    required: { type: Boolean, default: false },
    unit: { type: String }, // For numerical values (e.g., 'kg', 'cm', etc.)
    options: [String], // For predefined values/choices
}, { _id: false });

const categorySchema = mongoose.Schema(
    {
        // Store isolation - categories belong to stores
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        name: { 
            type: String, 
            required: true
        },
        slug: { 
            type: String, 
            required: true
        },
        description: { type: String },
        icon: { 
            type: String, 
            default: 'default-icon.png' 
        },
        color: { 
            type: String, 
            default: '#000000' 
        },
        image: {
            url: { type: String },
            public_id: { type: String }
        },
        // Support for nested categories
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null
        },
        // Product types allowed in this category (controls what products can be added)
        allowedProductTypes: [{
            type: String,
            enum: require('../config/productTypes').getProductTypeNames(),
            required: true,
            default: require('../config/productTypes').getProductTypeNames() // Allow all by default
        }],
        // Category-specific attributes (custom fields for products in this category)
        attributes: [categoryAttributeSchema],
        // For controlling display order
        displayOrder: { 
            type: Number, 
            default: 0 
        },
        // For category status
        isActive: { 
            type: Boolean, 
            default: true 
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Pre-save middleware to validate parent category compatibility
categorySchema.pre('save', async function(next) {
    if (this.parent) {
        try {
            const parentCategory = await this.constructor.findOne({
                _id: this.parent,
                store: this.store
            });
            
            if (!parentCategory) {
                return next(new Error('Parent category not found'));
            }
            
            // Child category should only allow product types that parent allows
            const incompatibleTypes = this.allowedProductTypes.filter(
                type => !parentCategory.allowedProductTypes.includes(type)
            );
            
            if (incompatibleTypes.length > 0) {
                return next(new Error(
                    `Category cannot allow product types [${incompatibleTypes.join(', ')}] ` +
                    `because parent category "${parentCategory.name}" doesn't allow them. ` +
                    `Parent allows: [${parentCategory.allowedProductTypes.join(', ')}]`
                ));
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Virtual for getting child categories
categorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// Virtual for getting products count
categorySchema.virtual('productsCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

// Method to check if category allows a specific product type
categorySchema.methods.allowsProductType = function(productType) {
    return this.allowedProductTypes.includes(productType);
};

// Method to get compatible product types for this category
categorySchema.methods.getCompatibleProductTypes = function() {
    return this.allowedProductTypes;
};

// Indexes
categorySchema.index({ store: 1, parent: 1 });
categorySchema.index({ store: 1, displayOrder: 1 });
categorySchema.index({ store: 1, isActive: 1 });
categorySchema.index({ store: 1, allowedProductTypes: 1 });
// Compound unique index for store + slug combination
categorySchema.index({ store: 1, slug: 1 }, { unique: true });
// Compound unique index for store + name combination (ensures names are unique per store)
categorySchema.index({ store: 1, name: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
