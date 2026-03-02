const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const healthBeautyVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    price: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    salePrice: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    sku: { type: String },
    countInStock: { type: Number, default: 0, min: 0 },
});

const healthBeautySchema = new mongoose.Schema({
    brand: { type: String },
    skinType: { 
        type: String, 
        enum: ['normal', 'dry', 'oily', 'combination', 'sensitive'] 
    },
    ingredients: [{ type: String }],
    volume: {
        value: { type: Number },
        unit: { type: String, enum: ['ml', 'oz', 'fl oz', 'g'] }
    },
    expiryDate: { type: Date },
    variants: [healthBeautyVariantSchema]
});

const HealthBeauty = BaseProduct.discriminator('HealthBeauty', healthBeautySchema);
module.exports = HealthBeauty;
