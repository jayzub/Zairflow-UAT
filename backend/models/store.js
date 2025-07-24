const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    logo: {
        url: { type: String },
        public_id: { type: String }
    },
    banner: {
        url: { type: String },
        public_id: { type: String }
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    contactInfo: {
        email: { type: String, required: true },
        phone: { type: String },
        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            zipCode: { type: String },
            country: { type: String, default: 'US' }
        }
    },
    settings: {
        currency: { type: String, default: 'USD' },
        timezone: { type: String, default: 'UTC' },
        language: { type: String, default: 'en' },
        taxRate: { type: Number, default: 0 },
        shippingEnabled: { type: Boolean, default: true },
        reviewsEnabled: { type: Boolean, default: true },
        socialLoginEnabled: { type: Boolean, default: false }
    },
    theme: {
        primaryColor: { type: String, default: '#007bff' },
        secondaryColor: { type: String, default: '#6c757d' },
        fontFamily: { type: String, default: 'Arial, sans-serif' }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    subscription: {
        plan: { type: String, default: 'free' }, // free, basic, premium, enterprise
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date },
        features: [String]
    },
    analytics: {
        totalSales: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        totalProducts: { type: Number, default: 0 },
        totalCustomers: { type: Number, default: 0 }
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Virtuals
storeSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Indexes
storeSchema.index({ slug: 1 });
storeSchema.index({ owner: 1 });
storeSchema.index({ isActive: 1 });
storeSchema.index({ 'subscription.plan': 1 });

// Pre-save middleware to update lastUpdated
storeSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Method to check if store has access to a feature
storeSchema.methods.hasFeature = function(feature) {
    return this.subscription.features.includes(feature);
};

// Method to check if store is on a paid plan
storeSchema.methods.isPaidPlan = function() {
    return this.subscription.plan !== 'free';
};

const Store = mongoose.model('Store', storeSchema);

module.exports = Store; 