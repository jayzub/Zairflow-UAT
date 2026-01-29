const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const booksVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    price: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    salePrice: { type: mongoose.Schema.Types.Decimal128, min: 0.0, default: 0.0 },
    sku: { type: String },
    countInStock: { type: Number, default: 0, min: 0 },
}, { _id: false });

const booksSchema = new mongoose.Schema({
    author: { type: String },
    publisher: { type: String },
    isbn: { type: String },
    language: { type: String },
    format: { 
        type: String, 
        enum: ['hardcover', 'paperback', 'ebook', 'audiobook'],
        default: 'paperback'
    },
    genre: [{ type: String }],
    pages: { type: Number, min: 1 },
    publicationDate: { type: Date },
    variants: [booksVariantSchema]
});

const Books = BaseProduct.discriminator('Books', booksSchema);
module.exports = Books; 