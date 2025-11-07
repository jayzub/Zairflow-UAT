/**
 * Script to update subscription plan for all stores owned by a user
 * 
 * Usage:
 * node backend/scripts/updateUserStoreSubscription.js <userEmail> <plan>
 * 
 * Example:
 * node backend/scripts/updateUserStoreSubscription.js user@example.com premium
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/user');
const Store = require('../models/store');

const plans = ['free', 'basic', 'premium', 'enterprise'];

async function updateUserStoreSubscription() {
    try {
        // Get arguments
        const args = process.argv.slice(2);
        
        if (args.length < 2) {
            console.error('Usage: node updateUserStoreSubscription.js <userEmail> <plan>');
            console.error('Plans: free, basic, premium, enterprise');
            process.exit(1);
        }
        
        const userEmail = args[0];
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
        
        // Find user by email
        const user = await User.findOne({ email: userEmail });
        
        if (!user) {
            console.error(`User with email "${userEmail}" not found`);
            process.exit(1);
        }
        
        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Role: ${user.role}`);
        
        // Get all stores owned by this user
        const stores = await Store.find({ owner: user._id });
        
        if (stores.length === 0) {
            console.log(`No stores found for user ${userEmail}`);
            process.exit(0);
        }
        
        console.log(`\nFound ${stores.length} store(s) owned by this user:`);
        stores.forEach((store, index) => {
            console.log(`  ${index + 1}. ${store.name} (${store.slug}) - Current plan: ${store.subscription?.plan || 'none'}`);
        });
        
        // Update subscription for all stores
        console.log(`\nUpdating subscription plan to: ${plan}...`);
        
        for (const store of stores) {
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
            console.log(`  ✓ Updated ${store.name} (${store.slug}) to ${plan}`);
        }
        
        console.log(`\n✓ Successfully updated subscription plan for all stores owned by ${userEmail}`);
        console.log(`  User: ${user.name} (${user.email})`);
        console.log(`  Stores updated: ${stores.length}`);
        console.log(`  New plan: ${plan}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating store subscription:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

updateUserStoreSubscription();

