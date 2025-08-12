const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Store isolation - reviews belong to stores
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    images: [{
        type: String,  // Will store URLs to uploaded images
        validate: {
            validator: function(url) {
                // Basic URL validation
                return /^https?:\/\/.+/.test(url);
            },
            message: 'Invalid image URL format'
        }
    }],
    dateCreated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Indexes for store isolation
reviewSchema.index({ store: 1, product: 1 });
reviewSchema.index({ store: 1, user: 1 });
reviewSchema.index({ store: 1, rating: 1 });
// Compound unique index for store + product + user combination
reviewSchema.index({ store: 1, product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 