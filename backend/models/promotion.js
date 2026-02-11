const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    value: {
        type: Number,
        required: true,
        min: 0
        // percentage: 0–100; fixed: amount in currency
    },
    minOrder: {
        type: Number,
        default: 0,
        min: 0
    },
    validFrom: {
        type: Date,
        default: null
    },
    validTo: {
        type: Date,
        default: null
    },
    usageLimit: {
        type: Number,
        default: null,
        min: 0
        // null = unlimited
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        default: null
        // null = marketplace-wide; set = store-specific
    },
    isActive: {
        type: Boolean,
        default: true
    },
    dateCreated: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

promotionSchema.index({ code: 1, store: 1 }, { unique: true });
promotionSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

promotionSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;
