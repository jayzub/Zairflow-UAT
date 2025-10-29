const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const electronicsVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    sku: { type: String }
}, { _id: false });

const electronicsSchema = new mongoose.Schema({
    modelNumber: { type: String },
    specifications: [{ 
        type: mongoose.Schema.Types.Mixed
    }],
    warranty: { type: String },
    dimensions: [{ 
        type: mongoose.Schema.Types.Mixed
    }],
    weight: { type: String },
    variants: [electronicsVariantSchema]
});

const Electronics = BaseProduct.discriminator('Electronics', electronicsSchema);
module.exports = Electronics; 