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
    dimensions: [{ 
        type: mongoose.Schema.Types.Mixed
    }],
    variants: [homeGardenVariantSchema]
});

const HomeGarden = BaseProduct.discriminator('HomeGarden', homeGardenSchema);
module.exports = HomeGarden;
