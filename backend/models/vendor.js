const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    // Store isolation - vendors belong to stores
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    email: { 
        type: String,
        default: null
        // Optional - store-specific unique when provided (sparse index)
    },
    phone: { 
        type: String 
    },
    address: { 
        type: String 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    dateCreated: { 
        type: Date, 
        default: Date.now 
    }
}, {
    toJSON: { virtuals: true }
});

vendorSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Indexes for store isolation
vendorSchema.index({ store: 1, isActive: 1 });
vendorSchema.index({ store: 1, name: 1 });
// Compound unique index for store + email combination (sparse - only when email exists)
vendorSchema.index({ store: 1, email: 1 }, { unique: true, sparse: true });

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor; 