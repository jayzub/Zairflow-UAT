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

// List all admins
const listAdmins = async () => {
  try {
    const admins = await User.find({ 
      role: { $in: ['platform_admin', 'store_owner', 'store_admin'] },
      isActive: true 
    }).select('-passwordHash');

    console.log('📋 Current Admins:');
    console.log('==================');
    
    if (admins.length === 0) {
      console.log('No admins found.');
      return;
    }

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Position: ${admin.position || 'N/A'}`);
      console.log(`   Verified: ${admin.isVerified ? '✅' : '❌'}`);
      console.log(`   Active: ${admin.isActive ? '✅' : '❌'}`);
      console.log(`   Platform Admin: ${admin.isPlatformAdmin ? '✅' : '❌'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing admins:', error);
  }
};

// Create platform admin
const createPlatformAdmin = async (email, password, name) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${email} already exists!`);
      return;
    }

    const adminData = {
      name: name || 'Platform Administrator',
      email: email,
      passwordHash: bcrypt.hashSync(password, 10),
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

    const platformAdmin = new User(adminData);
    await platformAdmin.save();

    console.log('✅ Platform admin created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   Name: ${platformAdmin.name}`);
    console.log(`   Email: ${platformAdmin.email}`);
    console.log(`   Role: ${platformAdmin.role}`);
    console.log(`   Permissions: ${platformAdmin.permissions.join(', ')}`);

  } catch (error) {
    console.error('❌ Error creating platform admin:', error);
  }
};

// Create store owner
const createStoreOwner = async (email, password, name) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${email} already exists!`);
      return;
    }

    const adminData = {
      name: name || 'Store Owner',
      email: email,
      passwordHash: bcrypt.hashSync(password, 10),
      phone: '+1234567890',
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
    };

    const storeOwner = new User(adminData);
    await storeOwner.save();

    console.log('✅ Store owner created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   Name: ${storeOwner.name}`);
    console.log(`   Email: ${storeOwner.email}`);
    console.log(`   Role: ${storeOwner.role}`);
    console.log(`   Permissions: ${storeOwner.permissions.join(', ')}`);

  } catch (error) {
    console.error('❌ Error creating store owner:', error);
  }
};

// Create store admin
const createStoreAdmin = async (email, password, name) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${email} already exists!`);
      return;
    }

    const adminData = {
      name: name || 'Store Admin',
      email: email,
      passwordHash: bcrypt.hashSync(password, 10),
      phone: '+1234567890',
      role: 'store_admin',
      position: 'Store Administrator',
      department: 'Operations',
      permissions: [
        'manage_products',
        'manage_orders',
        'manage_customers',
        'manage_categories',
        'view_analytics'
      ],
      isPlatformAdmin: false,
      isActive: true,
      isVerified: true,
      isAdmin: true
    };

    const storeAdmin = new User(adminData);
    await storeAdmin.save();

    console.log('✅ Store admin created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   Name: ${storeAdmin.name}`);
    console.log(`   Email: ${storeAdmin.email}`);
    console.log(`   Role: ${storeAdmin.role}`);
    console.log(`   Permissions: ${storeAdmin.permissions.join(', ')}`);

  } catch (error) {
    console.error('❌ Error creating store admin:', error);
  }
};

// Delete admin
const deleteAdmin = async (email) => {
  try {
    const admin = await User.findOne({ email });
    if (!admin) {
      console.log(`❌ Admin with email ${email} not found!`);
      return;
    }

    await User.findByIdAndDelete(admin._id);
    console.log(`✅ Admin ${email} deleted successfully!`);

  } catch (error) {
    console.error('❌ Error deleting admin:', error);
  }
};

// Reset admin password
const resetPassword = async (email, newPassword) => {
  try {
    const admin = await User.findOne({ email });
    if (!admin) {
      console.log(`❌ Admin with email ${email} not found!`);
      return;
    }

    admin.passwordHash = bcrypt.hashSync(newPassword, 10);
    await admin.save();

    console.log(`✅ Password for ${email} reset successfully!`);
    console.log(`   New password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  }
};

// Show help
const showHelp = () => {
  console.log(`
🔧 Admin Management Tool
========================

Usage: node backend/scripts/adminManager.js [command] [options]

Commands:
  list                    - List all admins
  create-platform-admin   - Create platform admin
  create-store-owner      - Create store owner
  create-store-admin      - Create store admin
  delete-admin            - Delete admin
  reset-password          - Reset admin password
  help                    - Show this help

Examples:
  node backend/scripts/adminManager.js list
  node backend/scripts/adminManager.js create-platform-admin admin@example.com password123 "John Doe"
  node backend/scripts/adminManager.js create-store-owner owner@store.com password123 "Store Owner"
  node backend/scripts/adminManager.js create-store-admin admin@store.com password123 "Store Admin"
  node backend/scripts/adminManager.js delete-admin admin@example.com
  node backend/scripts/adminManager.js reset-password admin@example.com newpassword123

Or use npm scripts:
  npm run create-admin
  `);
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    showHelp();
    process.exit(0);
  }

  console.log('🚀 Admin Management Tool\n');
  
  await connectDB();

  switch (command) {
    case 'list':
      await listAdmins();
      break;

    case 'create-platform-admin':
      if (args.length < 3) {
        console.log('❌ Usage: create-platform-admin <email> <password> [name]');
        process.exit(1);
      }
      await createPlatformAdmin(args[1], args[2], args[3]);
      break;

    case 'create-store-owner':
      if (args.length < 3) {
        console.log('❌ Usage: create-store-owner <email> <password> [name]');
        process.exit(1);
      }
      await createStoreOwner(args[1], args[2], args[3]);
      break;

    case 'create-store-admin':
      if (args.length < 3) {
        console.log('❌ Usage: create-store-admin <email> <password> [name]');
        process.exit(1);
      }
      await createStoreAdmin(args[1], args[2], args[3]);
      break;

    case 'delete-admin':
      if (args.length < 2) {
        console.log('❌ Usage: delete-admin <email>');
        process.exit(1);
      }
      await deleteAdmin(args[1]);
      break;

    case 'reset-password':
      if (args.length < 3) {
        console.log('❌ Usage: reset-password <email> <new-password>');
        process.exit(1);
      }
      await resetPassword(args[1], args[2]);
      break;

    default:
      console.log(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
  
  console.log('\n✅ Operation completed!');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 