const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const processorSchema = new mongoose.Schema({
    name: { type: String },
    cores: { type: Number },
    speed: { type: String },
    architecture: { type: String }
}, { _id: false });

const memorySchema = new mongoose.Schema({
    ram: { type: Number },
    ramUnit: { type: String, enum: ['GB', 'TB'], default: 'GB' },
    storage: { type: Number },
    storageUnit: { type: String, enum: ['GB', 'TB'], default: 'GB' },
    storageType: { type: String, enum: ['SSD', 'HDD', 'Other'] }
}, { _id: false });

const displaySchema = new mongoose.Schema({
    size: { type: Number },
    resolution: { type: String },
    technology: { type: String },
    refreshRate: { type: Number },
    brightness: { type: Number },
    hdr: { type: Boolean, default: false }
}, { _id: false });

const electronicsVariantSchema = new mongoose.Schema({
    color: { type: String },
    colorHex: { type: String },
    sku: { type: String }
}, { _id: false });

const electronicsSchema = new mongoose.Schema({
    modelNumber: { type: String },
    specifications: {
        processor: processorSchema,
        memory: memorySchema,
        display: displaySchema,
        ports: [{ 
            type: { type: String },
            quantity: { type: Number }
        }],
        connectivity: {
            wifi: { type: String },
            bluetooth: { type: String },
            ethernet: { type: Boolean }
        }
    },
    warranty: {
        duration: { type: Number }, // in months
        type: { type: String }
    },
    powerConsumption: { type: String },
    dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
        unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
    },
    color: { type: String },
    colorHex: { type: String },
    weight: {
        value: { type: Number },
        unit: { type: String, enum: ['kg', 'g', 'lb'], default: 'kg' }
    },
    variants: [electronicsVariantSchema]
});

const Electronics = BaseProduct.discriminator('Electronics', electronicsSchema);
module.exports = Electronics; 