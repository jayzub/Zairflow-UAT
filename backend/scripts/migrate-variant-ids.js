#!/usr/bin/env node
/**
 * Migration: Add MongoDB _id to existing product variants.
 *
 * After removing { _id: false } from variant schemas, new variants get _id automatically.
 * Existing variants in the DB do not have _id until updated.
 *
 * Uses raw MongoDB update (not Mongoose save) to avoid middleware (e.g. slug logic)
 * that can cause duplicate-key or other errors on existing data.
 *
 * Usage: node backend/scripts/migrate-variant-ids.js
 * Or:    DB_URL=mongodb://... node backend/scripts/migrate-variant-ids.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.DB_URL || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/griffin';

// Load models that Product refs (Store, Category, Vendor, Review) — required for findById/save
require('../models/store');
require('../models/category');
require('../models/vendor');
require('../models/review');

// Load discriminator models so they register with BaseProduct
require('../models/products/clothing');
require('../models/products/electronics');
require('../models/products/food');
require('../models/products/furniture');
require('../models/products/books');
require('../models/products/healthBeauty');
require('../models/products/homeGarden');
require('../models/products/sports');

const Product = require('../models/products/baseProduct');

async function migrate() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Use lean() to get raw stored data — Mongoose adds _id during hydration,
    // so we need the actual DB state to detect variants that lack _id
    const productsRaw = await Product.find({ variants: { $exists: true, $ne: [] } }).lean();
    let totalVariants = 0;
    let updatedProducts = 0;
    let variantsNeedingId = 0;

    for (const raw of productsRaw) {
        const variantCount = (raw.variants || []).length;
        totalVariants += variantCount;

        const needsUpdate = (raw.variants || []).some((v) => !v._id);
        if (needsUpdate) {
            const lackingCount = (raw.variants || []).filter((v) => !v._id).length;
            variantsNeedingId += lackingCount;
            const updatedVariants = (raw.variants || []).map((v) => ({
                ...v,
                _id: v._id || new mongoose.Types.ObjectId()
            }));
            await mongoose.connection.db.collection('products').updateOne(
                { _id: raw._id },
                { $set: { variants: updatedVariants, updatedAt: new Date() } }
            );
            updatedProducts++;
        }
    }

    console.log(`Products with variants: ${productsRaw.length}`);
    console.log(`Total variants: ${totalVariants}`);
    console.log(`Products updated (variants now have _id): ${updatedProducts}`);
    console.log(`Variants that lacked _id: ${variantsNeedingId}`);
}

migrate()
    .then(() => {
        console.log('Migration complete');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Migration failed:', err.message);
        if (err.code === 'ECONNREFUSED' || err.name === 'MongooseServerSelectionError' || (err.message && err.message.includes('ECONNREFUSED'))) {
            console.error('\nMongoDB connection refused. Is MongoDB running?');
            console.error('  - Local: start MongoDB (e.g. brew services start mongodb-community)');
            console.error('  - Or set DB_URL in .env to your MongoDB connection string');
        }
        process.exit(1);
    })
    .finally(() => mongoose.disconnect());
