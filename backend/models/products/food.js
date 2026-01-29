const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const foodVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    price: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    salePrice: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    sku: { type: String },
    countInStock: { type: Number, default: 0, min: 0 },
}, { _id: false });

const foodSchema = new mongoose.Schema({
    brand: { type: String },
    ingredients: [{ type: String }],
    nutritionalInfo: [{ 
        type: mongoose.Schema.Types.Mixed
    }],
    expiryDate: { type: Date },
    allergens: [{ type: String }],
    variants: [foodVariantSchema]
});

const Food = BaseProduct.discriminator('Food', foodSchema);
module.exports = Food;
