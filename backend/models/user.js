const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    // Backwards compatible: older code uses `name`, newer admin code uses first/last.
    firstName: {
        type: String,
        trim: true,
        default: ''
    },
    lastName: {
        type: String,
        trim: true,
        default: ''
    },
    name: {
        type: String,
        default: ''
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
        required: true,
        select: false
    },
    phone: {
        type: String,
        default: ''
    },
    avatar: {
        url: { type: String },
        public_id: { type: String }
    },
    role: {
        type: String,
        enum: ['store_owner', 'store_admin', 'platform_admin', 'admin'],
        required: true
    },
    // Legacy flag used in some controllers/token payloads
    isAdmin: {
        type: Boolean,
        default: false
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

// Accept plaintext password in controllers; store hashed in passwordHash.
userSchema.virtual('password').set(function (plaintext) {
    if (!plaintext) return;
    this.passwordHash = bcrypt.hashSync(String(plaintext), 10);
});

// Methods
userSchema.methods.hasPermission = function(permission) {
    const perms = Array.isArray(this.permissions) ? this.permissions : [];
    return perms.includes(permission) || this.isPlatformAdmin;
};

userSchema.methods.hasStoreAccess = function(storeId) {
    if (this.isPlatformAdmin) return true;
    const storeObjectId = typeof storeId === 'string' ? new mongoose.Types.ObjectId(storeId) : storeId;
    return this.ownedStores.some((id) => id.equals(storeObjectId)) ||
           this.adminStores.some((id) => id.equals(storeObjectId));
};

userSchema.methods.isStoreOwner = function(storeId) {
    const storeObjectId = typeof storeId === 'string' ? new mongoose.Types.ObjectId(storeId) : storeId;
    return this.ownedStores.some((id) => id.equals(storeObjectId));
};

userSchema.methods.isStoreAdmin = function(storeId) {
    const storeObjectId = typeof storeId === 'string' ? new mongoose.Types.ObjectId(storeId) : storeId;
    return this.adminStores.some((id) => id.equals(storeObjectId));
};

userSchema.methods.canManageStore = function(storeId) {
    return this.isPlatformAdmin || this.isStoreOwner(storeId);
};

// Keep `name` and `firstName/lastName` in sync.
userSchema.pre('validate', function (next) {
    // If admin-style fields provided, populate legacy `name`.
    if ((!this.name || !String(this.name).trim()) && (this.firstName || this.lastName)) {
        const derivedName = `${this.firstName || ''} ${this.lastName || ''}`.trim();
        if (derivedName) this.name = derivedName;
    }

    // If legacy `name` provided, best-effort populate first/last for newer code.
    if ((this.name && String(this.name).trim()) && (!this.firstName && !this.lastName)) {
        const parts = String(this.name).trim().split(/\s+/);
        this.firstName = parts[0] || '';
        this.lastName = parts.slice(1).join(' ') || '';
    }

    next();
});

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