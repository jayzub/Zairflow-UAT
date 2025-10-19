const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const sportsVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    sku: { type: String },
}, { _id: false });

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
