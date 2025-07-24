const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('../models/user');

// Database connection
const connectDB = async () => {
  try {
    const dbURL = process.env.DB_URL;
    
    if (!dbURL) {
      console.error('❌ DB_URL environment variable is not set!');
      console.log('💡 To fix this:');
      console.log('   1. Create a .env file in the backend directory');
      console.log('   2. Add your MongoDB Atlas connection string:');
      console.log('      DB_URL=mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority');
      console.log('   3. Or set it as an environment variable');
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
    console.log('💡 Check your connection string and network connection');
    process.exit(1);
  }
};

// Create platform admin
const createPlatformAdmin = async () => {
  try {
    // Check if platform admin already exists
    const existingAdmin = await User.findOne({ 
      role: 'platform_admin',
      isActive: true 
    });

    if (existingAdmin) {
      console.log('⚠️  Platform admin already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Platform admin data
    const adminData = {
      name: 'Platform Administrator',
      email: 'admin@platform.com',
      passwordHash: bcrypt.hashSync('admin123', 10),
      phone: '+1234567890',
      role: 'platform_admin',
      position: 'Platform Administrator',
      department: 'System Administration',
      permissions: [
        'manage_products',
        'manage_orders',
        'manage_customers',
        'manage_categories',
        'manage_store_settings',
        'view_analytics',
        'manage_admins',
        'manage_subscriptions',
        'platform_management'
      ],
      isPlatformAdmin: true,
      isActive: true,
      isVerified: true,
      isAdmin: true
    };

    // Create the platform admin
    const platformAdmin = new User(adminData);
    await platformAdmin.save();

    console.log('✅ Platform admin created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   Name: ${platformAdmin.name}`);
    console.log(`   Email: ${platformAdmin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${platformAdmin.role}`);
    console.log(`   Permissions: ${platformAdmin.permissions.join(', ')}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${platformAdmin.email}`);
    console.log(`   Password: admin123`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating platform admin:', error);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Creating Platform Admin...\n');
  
  await connectDB();
  await createPlatformAdmin();
  
  console.log('\n✅ Script completed!');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 