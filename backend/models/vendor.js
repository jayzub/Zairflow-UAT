const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
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
        required: true,
        unique: true 
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

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor; 