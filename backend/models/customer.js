const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    avatar: {
        url: { type: String },
        public_id: { type: String }
    },
    // Customer profile information
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        default: 'prefer_not_to_say'
    },
    // Address information
    addresses: [{
        type: {
            type: String,
            enum: ['billing', 'shipping', 'both'],
            default: 'both'
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        street: {
            type: String,
            required: true
        },
        apartment: {
            type: String
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true,
            default: 'US'
        },
        phone: {
            type: String
        }
    }],
    // Account status
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    // Shopping preferences
    preferences: {
        language: { type: String, default: 'en' },
        currency: { type: String, default: 'USD' },
        timezone: { type: String, default: 'UTC' },
        theme: { type: String, default: 'light' },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            marketing: { type: Boolean, default: true }
        }
    },
    // Shopping behavior
    wishlist: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    recentlyViewed: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Account activity
    lastLogin: {
        type: Date
    },
    loginHistory: [{
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String },
        userAgent: { type: String },
        location: { type: String }
    }],
    // Security and audit
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpires: {
        type: Date
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String
    },
    // Social login
    socialLogins: [{
        provider: {
            type: String,
            enum: ['google', 'facebook', 'apple', 'twitter']
        },
        providerId: {
            type: String
        },
        accessToken: {
            type: String
        },
        refreshToken: {
            type: String
        }
    }],
    // Customer metrics
    metrics: {
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
        lastOrderDate: { type: Date },
        favoriteCategories: [String],
        favoriteStores: [{
            store: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Store'
            },
            orderCount: { type: Number, default: 0 },
            totalSpent: { type: Number, default: 0 }
        }]
    }
}, {
    timestamps: true
});

// Virtuals
customerSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Methods
customerSchema.methods.getDefaultAddress = function(type = 'shipping') {
    return this.addresses.find(addr => 
        (addr.type === type || addr.type === 'both') && addr.isDefault
    ) || this.addresses.find(addr => addr.type === type) || this.addresses[0];
};

customerSchema.methods.addToWishlist = function(productId, storeId) {
    const existing = this.wishlist.find(item => 
        item.product.toString() === productId.toString() && 
        item.store.toString() === storeId.toString()
    );
    
    if (!existing) {
        this.wishlist.push({ product: productId, store: storeId });
    }
    
    return this.save();
};

customerSchema.methods.removeFromWishlist = function(productId, storeId) {
    this.wishlist = this.wishlist.filter(item => 
        !(item.product.toString() === productId.toString() && 
          item.store.toString() === storeId.toString())
    );
    
    return this.save();
};

customerSchema.methods.addToRecentlyViewed = function(productId, storeId) {
    // Remove if already exists
    this.recentlyViewed = this.recentlyViewed.filter(item => 
        !(item.product.toString() === productId.toString() && 
          item.store.toString() === storeId.toString())
    );
    
    // Add to beginning
    this.recentlyViewed.unshift({ product: productId, store: storeId });
    
    // Keep only last 20 items
    if (this.recentlyViewed.length > 20) {
        this.recentlyViewed = this.recentlyViewed.slice(0, 20);
    }
    
    return this.save();
};

customerSchema.methods.updateMetrics = function(orderTotal) {
    this.metrics.totalOrders += 1;
    this.metrics.totalSpent += orderTotal;
    this.metrics.averageOrderValue = this.metrics.totalSpent / this.metrics.totalOrders;
    this.metrics.lastOrderDate = new Date();
    
    return this.save();
};

// Pre-save middleware
customerSchema.pre('save', function(next) {
    if (this.isModified('passwordHash') && !this.isNew) {
        this.passwordChangedAt = new Date();
    }
    next();
});

// Indexes
customerSchema.index({ isActive: 1 });
customerSchema.index({ isVerified: 1 });
customerSchema.index({ 'wishlist.product': 1 });
customerSchema.index({ 'wishlist.store': 1 });
customerSchema.index({ 'metrics.lastOrderDate': 1 });

customerSchema.set('toJSON', {
    virtuals: true,
});

module.exports = mongoose.model('Customer', customerSchema); 