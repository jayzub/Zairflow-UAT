const mongoose = require('mongoose');
const BaseProduct = require('./baseProduct');

const booksVariantSchema = new mongoose.Schema({
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    sku: { type: String },
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