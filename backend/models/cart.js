const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    options: {
        color: { type: String },
        size: { type: String }
    },
    // Stable reference to the specific variant (product.variants[]._id). Null when product has no variants or is base-only.
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    unitPrice: {
        type: Number,
        default: null
    },
    unitOriginalPrice: {
        type: Number,
        default: null
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const cartSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },
    scopeType: {
        type: String,
        required: true,
        enum: ['store', 'marketplace'],
        index: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        default: null
        // Required when scopeType === 'store'; null when scopeType === 'marketplace'
    },
    items: {
        type: [cartItemSchema],
        default: []
    },
    appliedPromoCode: { type: String, trim: true, uppercase: true, default: null }
}, {
    timestamps: true
});

// One cart per customer per store; one marketplace cart per customer (store = null)
cartSchema.index({ customer: 1, scopeType: 1, store: 1 }, { unique: true });

cartSchema.pre('save', function (next) {
    if (this.scopeType === 'marketplace') {
        this.store = null;
    } else if (this.scopeType === 'store' && !this.store) {
        return next(new Error('Store is required when scopeType is "store"'));
    }
    next();
});

cartSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

cartSchema.set('toJSON', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
