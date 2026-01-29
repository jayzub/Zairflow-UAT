/**
 * ONE-TIME MIGRATION SCRIPT - Already executed
 * 
 * Script to drop the old 'name_1' unique index from categories collection
 * This index violated store isolation and was replaced with 'store_1_name_1' compound index
 * 
 * This script was run to fix the duplicate key error when creating categories
 * with the same name in different stores.
 * 
 * The fix is now in the model: backend/models/category.js
 * 
 * Run this script if you need to fix an existing database:
 * node backend/scripts/drop-category-name-index.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function dropOldIndex() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.DB_URL || process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('❌ MongoDB connection string not found!');
            console.error('Please set DB_URL or MONGODB_URI in your .env file');
            console.error('Current .env path:', require('path').join(__dirname, '../../.env'));
            process.exit(1);
        }
        
        console.log('Connecting to MongoDB...');
        console.log('Using connection string:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const categoriesCollection = db.collection('categories');

        // List all indexes
        const indexes = await categoriesCollection.indexes();
        console.log('Current indexes:', indexes.map(idx => idx.name));

        // Check if the problematic index exists
        const nameIndex = indexes.find(idx => idx.name === 'name_1' || (idx.key && idx.key.name === 1 && !idx.key.store));
        
        if (nameIndex) {
            console.log('Found old name_1 index:', nameIndex);
            console.log('Dropping old name_1 index...');
            
            await categoriesCollection.dropIndex('name_1');
            console.log('✓ Successfully dropped name_1 index');
        } else {
            console.log('✓ No old name_1 index found - database is already correct');
        }

        // Verify the new compound index exists
        const storeNameIndex = indexes.find(idx => 
            idx.key && idx.key.store === 1 && idx.key.name === 1 && idx.unique
        );
        
        if (storeNameIndex) {
            console.log('✓ Compound index (store_1_name_1) exists:', storeNameIndex.name);
        } else {
            console.log('⚠ Compound index (store_1_name_1) not found - it will be created on next model load');
        }

        console.log('\n✓ Index cleanup completed successfully');
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

dropOldIndex();
