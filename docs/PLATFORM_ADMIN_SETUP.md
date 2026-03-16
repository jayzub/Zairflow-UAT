# Platform Admin Setup Guide

## Overview

This guide explains how to create and manage platform administrators for your multi-tenant ecommerce platform.

## 🎯 **Quick Start: Create First Platform Admin**

### **Prerequisites**

Before creating the first platform admin, ensure:

1. **MongoDB Atlas is configured**:
   - You have a MongoDB Atlas account and cluster
   - Your connection string is ready
   - Network access is configured

2. **Environment variables are set**:
   - Create `.env` file in `backend` directory
   - Add your MongoDB Atlas connection string:
     ```env
     DB_URL=mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority
     ```

**📚 For detailed MongoDB Atlas setup, see: [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)**

### **Method 1: Using the Simple Script (Recommended)**

```bash
# Create the first platform admin with default credentials
npm run create-admin
```

This will create a platform admin with:
- **Email**: `admin@platform.com`
- **Password**: `admin123`
- **Role**: `platform_admin`
- **Full permissions**: All platform management capabilities

### **Method 2: Using the Advanced Admin Manager**

```bash
# Create a custom platform admin
npm run admin:create-platform admin@yourcompany.com securepassword123 "Your Name"
```

### **Method 3: Direct Command Line**

```bash
# Using the admin manager script directly
node backend/scripts/adminManager.js create-platform-admin admin@example.com password123 "John Doe"
```

### **Method 4: Using Swagger UI (Alternative)**

If MongoDB isn't running or you prefer a web interface:

1. **Start your server**:
   ```bash
   npm run dev
   ```

2. **Access Swagger UI**:
   ```
   http://localhost:3001/api-docs
   ```

3. **Use the registration endpoint**:
   - Go to `POST /users/register`
   - Enter admin data:
     ```json
     {
       "name": "Platform Administrator",
       "email": "admin@platform.com",
       "password": "admin123",
       "phone": "+1234567890",
       "role": "platform_admin",
       "position": "Platform Administrator",
       "department": "System Administration"
     }
     ```

4. **Login with the created account**:
   - Go to `POST /users/login`
   - Enter credentials and get JWT token

### **Method 5: Direct Database Insert (Advanced)**

If you have MongoDB access, you can create the admin directly:

```javascript
// Connect to MongoDB and run this in mongo shell
use ecommerce

db.users.insertOne({
  name: "Platform Administrator",
  email: "admin@platform.com",
  passwordHash: "$2a$10$YOUR_HASHED_PASSWORD", // Use bcrypt to hash "admin123"
  phone: "+1234567890",
  role: "platform_admin",
  position: "Platform Administrator",
  department: "System Administration",
  permissions: [
    "manage_products",
    "manage_orders", 
    "manage_customers",
    "manage_categories",
    "manage_store_settings",
    "view_analytics",
    "manage_admins",
    "manage_subscriptions",
    "platform_management"
  ],
  isPlatformAdmin: true,
  isActive: true,
  isVerified: true,
  isAdmin: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🔧 **Admin Management Commands**

### **List All Admins**
```bash
npm run admin:list
```

### **Create Different Types of Admins**

#### **Platform Admin** (Full system access)
```bash
npm run admin:create-platform admin@platform.com password123 "Platform Admin"
```

#### **Store Owner** (Can create and manage stores)
```bash
npm run admin:create-store-owner owner@store.com password123 "Store Owner"
```

#### **Store Admin** (Can manage specific stores)
```bash
npm run admin:create-store-admin admin@store.com password123 "Store Admin"
```

### **Manage Existing Admins**

#### **Delete Admin**
```bash
npm run admin:delete admin@example.com
```

#### **Reset Password**
```bash
npm run admin:reset-password admin@example.com newpassword123
```

### **Get Help**
```bash
npm run admin:help
```

## 👥 **Admin Roles and Permissions**

### **Platform Admin** (`platform_admin`)
**Full system access with all permissions:**
- `manage_products` - Create, update, delete products
- `manage_orders` - View and manage all orders
- `manage_customers` - View and manage customer accounts
- `manage_categories` - Create and manage product categories
- `manage_store_settings` - Configure store settings
- `view_analytics` - Access analytics and reports
- `manage_admins` - Create and manage other admins
- `manage_subscriptions` - Manage store subscriptions
- `platform_management` - Full platform administration

### **Store Owner** (`store_owner`)
**Can create and manage their own stores:**
- `manage_products` - Manage products in their stores
- `manage_orders` - View orders for their stores
- `manage_customers` - View customers who shopped at their stores
- `manage_categories` - Create categories for their stores
- `manage_store_settings` - Configure their store settings
- `view_analytics` - View analytics for their stores
- `manage_admins` - Add admins to their stores

### **Store Admin** (`store_admin`)
**Can manage specific stores they're assigned to:**
- `manage_products` - Manage products in assigned stores
- `manage_orders` - View orders for assigned stores
- `manage_customers` - View customers for assigned stores
- `manage_categories` - Manage categories in assigned stores
- `view_analytics` - View analytics for assigned stores

## 🚀 **Step-by-Step Setup**

### **Step 1: Create the First Platform Admin**

```bash
# Option A: Quick setup with default credentials
npm run create-admin

# Option B: Custom setup
npm run admin:create-platform admin@yourcompany.com yourpassword123 "Your Name"
```

### **Step 2: Verify the Admin was Created**

```bash
npm run admin:list
```

You should see output like:
```
📋 Current Admins:
==================
1. Platform Administrator
   Email: admin@platform.com
   Role: platform_admin
   Position: Platform Administrator
   Verified: ✅
   Active: ✅
   Platform Admin: ✅
```

### **Step 3: Login to the Platform**

1. **Start your server**:
   ```bash
   npm run dev
   ```

2. **Access Swagger UI**:
   ```
   http://localhost:3001/api-docs
   ```

3. **Login as Platform Admin**:
   - Go to `POST /users/login`
   - Enter credentials:
     ```json
     {
       "email": "admin@platform.com",
       "password": "admin123"
     }
     ```

4. **Get your JWT token** from the response

5. **Authorize in Swagger UI**:
   - Click the "Authorize" button (🔒)
   - Enter: `Bearer YOUR_JWT_TOKEN`
   - Click "Authorize"

### **Step 4: Test Platform Admin Features**

Now you can test platform admin endpoints:

- `GET /platform/overview` - Platform overview
- `GET /platform/analytics` - Platform analytics
- `GET /platform/stores` - View all stores
- `PUT /platform/stores/{storeId}/verify` - Verify stores
- `PUT /platform/stores/{storeId}/status` - Toggle store status

## 🔐 **Security Best Practices**

### **1. Change Default Password**
After first login, immediately change the default password:

```bash
npm run admin:reset-password admin@platform.com yournewsecurepassword
```

### **2. Use Strong Passwords**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Avoid common words or patterns

### **3. Regular Password Updates**
- Change passwords every 90 days
- Use unique passwords for different accounts

### **4. Limit Admin Access**
- Only create platform admins when necessary
- Use store owners and store admins for day-to-day operations
- Regularly review admin permissions

## 📋 **Admin Management Workflow**

### **Creating Store Owners**
```bash
# Create a store owner who can create their own stores
npm run admin:create-store-owner jane@store.com password123 "Jane Store Owner"
```

### **Creating Store Admins**
```bash
# Create a store admin for specific store management
npm run admin:create-store-admin bob@store.com password123 "Bob Store Admin"
```

### **Managing Multiple Admins**
```bash
# List all admins
npm run admin:list

# Delete an admin
npm run admin:delete admin@example.com

# Reset password for an admin
npm run admin:reset-password admin@example.com newpassword123
```

## 🛠️ **Troubleshooting**

### **Issue: "Admin already exists"**
**Solution**: Use a different email address or delete the existing admin first.

### **Issue: "MongoDB connection error"**
**Solutions**:
1. **Start MongoDB**:
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

2. **Check MongoDB status**:
   ```bash
   # Check if MongoDB is running
   mongo --eval "db.runCommand('ping')"
   
   # Or check process
   ps aux | grep mongod
   ```

3. **Verify connection string**:
   - Check your `.env` file
   - Default: `mongodb://localhost:27017/ecommerce`
   - Try: `mongodb://127.0.0.1:27017/ecommerce`

4. **Alternative: Use Swagger UI method** (Method 4 above)

### **Issue: "Permission denied"**
**Solution**: Ensure you're using a platform admin account with full permissions.

### **Issue: "Token expired"**
**Solution**: Re-login to get a new JWT token.

### **Issue: "Script not found"**
**Solution**: Make sure you're in the project root directory and all files are present.

### **Issue: "bcrypt error"**
**Solution**: Ensure bcryptjs is installed:
```bash
npm install bcryptjs
```

## 📞 **Support**

If you encounter issues:

1. **Check the logs** for error messages
2. **Verify MongoDB connection** is working
3. **Ensure all dependencies** are installed
4. **Check file permissions** for the scripts

## 🎯 **Next Steps**

After creating your first platform admin:

1. **Login and explore** the platform admin features
2. **Create some test stores** to understand the workflow
3. **Set up store owners** for different business units
4. **Configure platform settings** and policies
5. **Test the multi-tenant features**

## 📚 **Related Documentation**

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Multi-Tenant Architecture](./MULTI_TENANT_ARCHITECTURE.md) - System architecture
- [User/Customer Separation](./USER_CUSTOMER_SEPARATION.md) - User model details
- [Swagger Authentication Guide](./SWAGGER_AUTHENTICATION_GUIDE.md) - API testing guide 