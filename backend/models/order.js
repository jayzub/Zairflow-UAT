const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    // Store isolation - orders belong to stores
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    orderItems : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
        required: true,
    }],
    shippingAddress1: {
        type: String
    },
    shippingAddress2: {
        type: String
    },
    city: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'pending',
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    },
    totalPrice: {
        type: Number
    },
    subtotal: {
        type: Number
    },
    tax: {
        type: Number,
        default: 0
    },
    shipping: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    dateOrdered: {
        type: Date,
        default: Date.now
    },
    dateShipped: {
        type: Date
    },
    dateDelivered: {
        type: Date
    },
    trackingNumber: {
        type: String
    },
    paymentStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'paid', 'failed', 'refunded']
    },
    paymentMethod: {
        type: String
    },
    stripePaymentMethodId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})


orderSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

orderSchema.set('toJSON', {
    virtuals: true,
});

module.exports = mongoose.model('Order', orderSchema);