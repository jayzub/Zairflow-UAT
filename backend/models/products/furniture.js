const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const furnitureVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    price: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    salePrice: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    sku: { type: String },
    countInStock: { type: Number, default: 0, min: 0 },
});

const furnitureSchema = new mongoose.Schema({
    dimensions: [{ 
        type: mongoose.Schema.Types.Mixed
    }],
    weight: { type: String },
    material: [{ type: String }],
    isAssembly: { type: Boolean, default: false },
    style: { type: String },
    roomType: [{ type: String }],
    warranty: { type: String },
    variants: [furnitureVariantSchema]
});

const Furniture = BaseProduct.discriminator('Furniture', furnitureSchema);
module.exports = Furniture; 