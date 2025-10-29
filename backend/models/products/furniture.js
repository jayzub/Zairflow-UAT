const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const furnitureVariantSchema = new mongoose.Schema({
    color: { type: String },
    colorHex: { type: String },
    sku: { type: String }
}, { _id: false });

const furnitureSchema = new mongoose.Schema({
    dimensions: [{ 
        type: mongoose.Schema.Types.Mixed
    }],
    weight: { type: String },
    material: [{ type: String }],
    assembly: { type: Boolean, default: false },
    style: { type: String },
    roomType: [{ type: String }],
    warranty: { type: String },
    variants: [furnitureVariantSchema]
});

const Furniture = BaseProduct.discriminator('Furniture', furnitureSchema);
module.exports = Furniture; 