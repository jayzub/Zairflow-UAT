const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const healthBeautyVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    sku: { type: String },
}, { _id: false });

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
