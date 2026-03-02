const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const sportsVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    price: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    salePrice: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    sku: { type: String },
    countInStock: { type: Number, default: 0, min: 0 },
});

const sportsSchema = new mongoose.Schema({
    sport: { type: String },
    skillLevel: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced', 'professional'] 
    },
    material: { type: String },
    weight: {
        value: { type: Number },
        unit: { type: String, enum: ['g', 'kg', 'oz', 'lb'] }
    },
    variants: [sportsVariantSchema]
});

const Sports = BaseProduct.discriminator('Sports', sportsSchema);
module.exports = Sports;
