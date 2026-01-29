const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const homeGardenVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    price: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    salePrice: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    sku: { type: String },
    countInStock: { type: Number, default: 0, min: 0 },
}, { _id: false });

const homeGardenSchema = new mongoose.Schema({
    room: { type: String },
    material: { type: String },
    dimensions: [{ 
        type: mongoose.Schema.Types.Mixed
    }],
    variants: [homeGardenVariantSchema]
});

const HomeGarden = BaseProduct.discriminator('HomeGarden', homeGardenSchema);
module.exports = HomeGarden;
