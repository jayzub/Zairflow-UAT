const mongoose = require('mongoose');

const baseProductSchema = new mongoose.Schema({
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
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true,
    }],
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        index: true
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
    dateCreated: { type: Date, default: Date.now },
    countInStock: { type: Number, default: 0, min: 0, max: 255 },
}, { 
    discriminatorKey: 'productType',
    toJSON: { virtuals: true }
});

// Virtuals
baseProductSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Indexes
baseProductSchema.index({ isFeatured: 1 });
baseProductSchema.index({ category: 1 });
baseProductSchema.index({ brand: 1 });
baseProductSchema.index({ name: 'text', description: 'text' });
baseProductSchema.index({ tags: 1 });

const BaseProduct = mongoose.model('Product', baseProductSchema);

module.exports = BaseProduct; 