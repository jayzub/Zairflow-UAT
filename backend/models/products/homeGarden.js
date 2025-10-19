const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const homeGardenVariantSchema = new mongoose.Schema({
    color: { type: String },
    size: { type: String },
    sku: { type: String },
}, { _id: false });

const homeGardenSchema = new mongoose.Schema({
    room: { type: String },
    material: { type: String },
    dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
        unit: { type: String, enum: ['cm', 'in', 'ft', 'm'] }
    },
    variants: [homeGardenVariantSchema]
});

const HomeGarden = BaseProduct.discriminator('HomeGarden', homeGardenSchema);
module.exports = HomeGarden;
