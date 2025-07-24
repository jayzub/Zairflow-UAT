const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/user');
const Store = require('../models/store');

// Database connection
const connectDB = async () => {
  try {
    const dbURL = process.env.DB_URL;
    
    if (!dbURL) {
      console.error('❌ DB_URL environment variable is not set!');
      console.log('💡 Create a .env file in the backend directory with your MongoDB Atlas connection string');
      process.exit(1);
    }
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(dbURL, options);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('   Database:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    process.exit(1);
  }
};

// Create store owner and store
const createStoreAndOwner = async (ownerData, storeData) => {
  try {
    console.log('🚀 Creating store owner and store...\n');

    // Check if owner already exists
    const existingOwner = await User.findOne({ email: ownerData.email });
    if (existingOwner) {
      console.log(`⚠️  Owner with email ${ownerData.email} already exists!`);
      return { owner: existingOwner, store: null };
    }

    // Create store owner
    console.log('👤 Creating store owner...');
    const owner = new User({
      name: ownerData.name,
      email: ownerData.email,
      passwordHash: bcrypt.hashSync(ownerData.password, 10),
      phone: ownerData.phone,
      role: 'store_owner',
      position: 'Store Owner',
      department: 'Management',
      permissions: [
        'manage_products',
        'manage_orders',
        'manage_customers',
        'manage_categories',
        'manage_store_settings',
        'view_analytics',
        'manage_admins'
      ],
      isPlatformAdmin: false,
      isActive: true,
      isVerified: true,
      isAdmin: true
    });

    await owner.save();
    console.log('✅ Store owner created successfully!');

    // Create store
    console.log('🏪 Creating store...');
    const store = new Store({
      name: storeData.name,
      slug: storeData.slug,
      description: storeData.description,
      owner: owner._id,
      admins: [owner._id],
      contactInfo: storeData.contactInfo,
      settings: storeData.settings,
      theme: storeData.theme,
      subscription: {
        plan: 'basic',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        features: ['basic_store', 'product_management', 'order_management']
      },
      isActive: true,
      isVerified: false,
      dateCreated: new Date(),
      lastUpdated: new Date()
    });

    await store.save();
    console.log('✅ Store created successfully!');

    // Update owner with store reference
    owner.stores = [store._id];
    await owner.save();

    console.log('\n🎉 Store and owner created successfully!');
    console.log('📋 Details:');
    console.log(`   Owner: ${owner.name} (${owner.email})`);
    console.log(`   Store: ${store.name} (${store.slug})`);
    console.log(`   Store ID: ${store._id}`);
    console.log(`   Owner ID: ${owner._id}`);

    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${owner.email}`);
    console.log(`   Password: ${ownerData.password}`);

    console.log('\n🌐 Store URL:');
    console.log(`   http://localhost:3001/api/v1/stores/${store._id}`);

    return { owner, store };

  } catch (error) {
    console.error('❌ Error creating store and owner:', error);
    throw error;
  }
};

// Example usage
const main = async () => {
  console.log('🏪 Store and Owner Creation Tool\n');
  
  await connectDB();

  // Example data
  const ownerData = {
    name: 'John Store Owner',
    email: 'john@store.com',
    password: 'password123',
    phone: '+1234567890'
  };

  const storeData = {
    name: 'John\'s Electronics Store',
    slug: 'johns-electronics',
    description: 'Premium electronics and gadgets store',
    contactInfo: {
      email: 'contact@johnselectronics.com',
      phone: '+1234567890',
      address: {
        street: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA'
      }
    },
    settings: {
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      language: 'en',
      taxRate: 8.5,
      shippingEnabled: true,
      reviewsEnabled: true
    },
    theme: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'Arial, sans-serif'
    }
  };

  try {
    await createStoreAndOwner(ownerData, storeData);
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
  }

  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 