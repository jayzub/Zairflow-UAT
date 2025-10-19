const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const foodVariantSchema = new mongoose.Schema({
    flavor: { type: String },
    size: { type: String },
    sku: { type: String },
}, { _id: false });

const foodSchema = new mongoose.Schema({
    brand: { type: String },
    ingredients: [{ type: String }],
    nutritionalInfo: {
        calories: { type: Number },
        protein: { type: Number },
        carbs: { type: Number },
        fat: { type: Number },
        fiber: { type: Number },
        sugar: { type: Number },
        sodium: { type: Number }
    },
    expiryDate: { type: Date },
    allergens: [{ type: String }],
    variants: [foodVariantSchema]
});

const Food = BaseProduct.discriminator('Food', foodSchema);
module.exports = Food;
