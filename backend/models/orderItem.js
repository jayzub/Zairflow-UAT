const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    quantity: {
        type: Number,
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    unitPrice: {
        type: Number,
        default: null
    },
    // Stable reference to the variant purchased. Null when product has no variants.
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    // Display: which options were selected (e.g. color: "Blue", size: "M")
    options: {
        color: { type: String },
        size: { type: String }
    }
})

module.exports = mongoose.model('OrderItem', orderItemSchema);