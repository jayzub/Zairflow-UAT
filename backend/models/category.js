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
        name: { 
            type: String, 
            required: true,
            unique: true
        },
        slug: { 
            type: String, 
            required: true,
            unique: true 
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
        // Allowed product types for this category
        allowedProductTypes: [{
            type: String,
            enum: ['Electronics', 'Clothing', 'Furniture'],
            required: true
        }],
        // Category-specific attributes
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

// Indexes
categorySchema.index({ parent: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ displayOrder: 1 });

// Example usage of the model:
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
