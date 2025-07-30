const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
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
    role: {
        type: String,
        enum: ['store_owner', 'store_admin', 'platform_admin'],
        required: true
    },
    // Store ownership and admin access
    ownedStores: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    }],
    adminStores: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    }],
    // Platform-level admin
    isPlatformAdmin: {
        type: Boolean,
        default: false
    },
    // Admin profile information
    position: {
        type: String,
        default: ''
    },
    department: {
        type: String,
        default: ''
    },
    permissions: [{
        type: String,
        enum: [
            'manage_products',
            'manage_orders',
            'manage_customers',
            'manage_categories',
            'manage_store_settings',
            'view_analytics',
            'manage_admins',
            'manage_subscriptions',
            'platform_management'
        ]
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
    lastLogin: {
        type: Date
    },
    loginHistory: [{
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String },
        userAgent: { type: String }
    }],
    preferences: {
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'UTC' },
        theme: { type: String, default: 'light' },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        }
    },
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
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String
    }
}, {
    timestamps: true
})

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Methods
userSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission) || this.isPlatformAdmin;
};

userSchema.methods.hasStoreAccess = function(storeId) {
    return this.isPlatformAdmin || 
           this.ownedStores.includes(storeId) || 
           this.adminStores.includes(storeId);
};

userSchema.methods.isStoreOwner = function(storeId) {
    return this.ownedStores.includes(storeId);
};

userSchema.methods.isStoreAdmin = function(storeId) {
    return this.adminStores.includes(storeId);
};

userSchema.methods.canManageStore = function(storeId) {
    return this.isPlatformAdmin || this.isStoreOwner(storeId);
};

// Pre-save middleware
userSchema.pre('save', function(next) {
    if (this.isModified('passwordHash') && !this.isNew) {
        this.passwordChangedAt = new Date();
    }
    next();
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ ownedStores: 1 });
userSchema.index({ adminStores: 1 });

userSchema.set('toJSON', {
    virtuals: true,
});

module.exports = mongoose.model('User', userSchema);