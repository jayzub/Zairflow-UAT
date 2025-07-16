const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const furnitureVariantSchema = new mongoose.Schema({
    color: { type: String },
    colorHex: { type: String },
    sku: { type: String }
}, { _id: false });

const furnitureSchema = new mongoose.Schema({
    dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
        unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
    },
    weight: {
        value: { type: Number },
        unit: { type: String, enum: ['kg', 'lb'], default: 'kg' }
    },
    materials: [{
        type: { type: String },
        description: { type: String }
    }],
    assembly: {
        required: { type: Boolean, default: false },
        estimatedTime: { type: String },
        toolsIncluded: { type: Boolean, default: false }
    },
    capacity: { type: String },
    style: { type: String },
    color: { type: String },
    colorHex: { type: String },
    roomType: [{ type: String }],
    warranty: {
        duration: { type: Number }, // in months
        coverage: { type: String }
    },
    variants: [furnitureVariantSchema]
});

const Furniture = BaseProduct.discriminator('Furniture', furnitureSchema);
module.exports = Furniture; 