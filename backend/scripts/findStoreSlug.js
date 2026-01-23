/**
 * Script to find store slug by name or ID
 * 
 * Usage:
 * node backend/scripts/findStoreSlug.js <storeNameOrId>
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Store = require('../models/store');

async function findStoreSlug() {
    try {
        const args = process.argv.slice(2);
        
        if (args.length < 1) {
            console.error('Usage: node findStoreSlug.js <storeNameOrId>');
            process.exit(1);
        }
        
        const searchTerm = args[0];
        
        // Connect to MongoDB
        const mongoUri = process.env.DB_URL || process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('❌ MongoDB connection string not found!');
            process.exit(1);
        }
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        
        // Try to find by ID first
        let store = null;
        if (mongoose.Types.ObjectId.isValid(searchTerm)) {
            store = await Store.findById(searchTerm);
        }
        
        // If not found by ID, try by name (case-insensitive)
        if (!store) {
            store = await Store.findOne({ 
                name: { $regex: new RegExp(searchTerm, 'i') }
            });
        }
        
        // If still not found, try by slug
        if (!store) {
            store = await Store.findOne({ 
                slug: { $regex: new RegExp(searchTerm, 'i') }
            });
        }
        
        if (!store) {
            console.error(`❌ Store not found with search term: "${searchTerm}"`);
            process.exit(1);
        }
        
        console.log('Found store:');
        console.log(`  Name: ${store.name}`);
        console.log(`  Slug: ${store.slug}`);
        console.log(`  ID: ${store._id}`);
        console.log(`  Current Plan: ${store.subscription?.plan || 'none'}`);
        console.log(`\nTo update to enterprise plan, run:`);
        console.log(`  node backend/scripts/updateStoreSubscription.js ${store.slug} enterprise`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error finding store:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

findStoreSlug();

