/**
 * Script to update store subscription plan
 * 
 * Usage:
 * node backend/scripts/updateStoreSubscription.js <storeSlug> <plan>
 * 
 * Example:
 * node backend/scripts/updateStoreSubscription.js mystore premium
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Store = require('../models/store');

const plans = ['free', 'basic', 'premium', 'enterprise'];

async function updateStoreSubscription() {
    try {
        // Get arguments
        const args = process.argv.slice(2);
        
        if (args.length < 2) {
            console.error('Usage: node updateStoreSubscription.js <storeSlug> <plan>');
            console.error('Plans: free, basic, premium, enterprise');
            process.exit(1);
        }
        
        const storeSlug = args[0];
        const plan = args[1].toLowerCase();
        
        if (!plans.includes(plan)) {
            console.error(`Invalid plan: ${plan}`);
            console.error('Valid plans: free, basic, premium, enterprise');
            process.exit(1);
        }
        
        // Connect to MongoDB
        const mongoUri = process.env.DB_URL || process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('❌ MongoDB connection string not found!');
            console.error('Please set DB_URL or MONGODB_URI in your .env file');
            console.error('Current .env path:', require('path').join(__dirname, '../../.env'));
            console.error('Environment variables loaded:', {
                hasDB_URL: !!process.env.DB_URL,
                hasMONGODB_URI: !!process.env.MONGODB_URI
            });
            process.exit(1);
        }
        
        console.log('Connecting to MongoDB...');
        console.log('Using connection string:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        
        // Find store by slug
        const store = await Store.findOne({ slug: storeSlug });
        
        if (!store) {
            console.error(`Store with slug "${storeSlug}" not found`);
            process.exit(1);
        }
        
        console.log(`Found store: ${store.name} (${store.slug})`);
        console.log(`Current plan: ${store.subscription?.plan || 'none'}`);
        
        // Update subscription
        store.subscription = store.subscription || {};
        store.subscription.plan = plan;
        store.subscription.startDate = store.subscription.startDate || new Date();
        
        // Set end date to 1 year from now for premium/enterprise plans
        if (plan === 'premium' || plan === 'enterprise') {
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            store.subscription.endDate = endDate;
        }
        
        await store.save();
        
        console.log(`✓ Successfully updated store subscription to: ${plan}`);
        console.log(`  Store: ${store.name}`);
        console.log(`  Plan: ${store.subscription.plan}`);
        console.log(`  Start Date: ${store.subscription.startDate}`);
        if (store.subscription.endDate) {
            console.log(`  End Date: ${store.subscription.endDate}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating store subscription:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

updateStoreSubscription();

