const mongoose = require('mongoose');

const customProductTypeSchema = new mongoose.Schema({
    // Store isolation - custom product types are store-specific
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: 'fas fa-box'
    },
    color: {
        type: String,
        default: '#6c757d'
    },
    // Fields configuration - same structure as predefined product types
    fields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Variant fields that can be used
    variantFields: [{
        type: String,
        trim: true
    }],
    // Whether this custom product type is active
    isActive: {
        type: Boolean,
        default: true
    },
    // Created by user
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    dateUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure unique product type names per store
customProductTypeSchema.index({ store: 1, name: 1 }, { unique: true });

// Method to convert to productTypes.js format
customProductTypeSchema.methods.toProductTypeConfig = function() {
    // Convert Map to object
    const fieldsObj = {};
    if (this.fields instanceof Map) {
        this.fields.forEach((value, key) => {
            fieldsObj[key] = value;
        });
    } else {
        Object.assign(fieldsObj, this.fields || {});
    }
    
    return {
        name: this.name,
        displayName: this.displayName,
        description: this.description,
        icon: this.icon,
        color: this.color,
        fields: fieldsObj,
        variantFields: this.variantFields || [],
        subscriptionPlans: ['custom'], // Custom product types are always available
        isCustom: true, // Flag to identify custom product types
        store: this.store.toString()
    };
};

// Static method to get all custom product types for a store
customProductTypeSchema.statics.getByStore = async function(storeId) {
    return this.find({ 
        store: storeId, 
        isActive: true 
    }).sort({ displayName: 1 });
};

// Static method to get custom product type by name and store
customProductTypeSchema.statics.getByNameAndStore = async function(name, storeId) {
    return this.findOne({ 
        name: name, 
        store: storeId, 
        isActive: true 
    });
};

const CustomProductType = mongoose.model('CustomProductType', customProductTypeSchema);

module.exports = CustomProductType;

