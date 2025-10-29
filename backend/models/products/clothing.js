const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const clothingVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    sku: { type: String },
}, { _id: false });

const clothingSchema = new mongoose.Schema({
    material: { type: String },
    materialComposition: [{ 
        type: mongoose.Schema.Types.Mixed
    }],
    care: [{ type: String }],
    fit: { type: String },
    season: { type: String },
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'] },
    measurements: {
        sizeChart: { type: String },
        fitType: { type: String }
    },
    variants: [clothingVariantSchema]
});

const Clothing = BaseProduct.discriminator('Clothing', clothingSchema);
module.exports = Clothing; 