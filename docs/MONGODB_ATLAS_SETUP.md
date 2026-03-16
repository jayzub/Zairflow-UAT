# MongoDB Atlas Setup Guide

## Overview

This guide explains how to set up MongoDB Atlas and create your first platform admin for the multi-tenant ecommerce platform.

## 🚀 **Quick Start: MongoDB Atlas Setup**

### **Step 1: Get Your MongoDB Atlas Connection String**

1. **Login to MongoDB Atlas**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Sign in to your account

2. **Navigate to your cluster**:
   - Click on your cluster name
   - Go to "Connect" button

3. **Get connection string**:
   - Click "Connect your application"
   - Choose "Node.js" as driver
   - Copy the connection string

4. **Format your connection string**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority
   ```
   - Replace `username` with your Atlas username
   - Replace `password` with your Atlas password
   - Replace `cluster.mongodb.net` with your actual cluster URL
   - The database name `griffin` will be created automatically

### **Step 2: Set Up Environment Variables**

#### **Option A: Create .env file (Recommended for Development)**

Create a `.env` file in the `backend` directory:

```bash
# Navigate to backend directory
cd backend

# Create .env file
touch .env
```

Add your MongoDB Atlas connection string to the `.env` file:

```env
# MongoDB Atlas Connection
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority

# Other environment variables
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
PORT=3001
```

#### **Option B: Set Environment Variable (Production)**

```bash
# Set environment variable
export DB_URL="mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority"
```

### **Step 3: Test Database Connection**

```bash
# Test the connection
npm run dev
```

You should see:
```
🔄 Connecting to MongoDB Atlas...
✅ Connected to MongoDB Atlas
   Database: griffin
```

## 🎯 **Create Your First Platform Admin**

### **Method 1: Using the Script (Recommended)**

```bash
# Create platform admin with default credentials
npm run create-admin
```

This creates:
- **Email**: `admin@platform.com`
- **Password**: `admin123`
- **Role**: `platform_admin`

### **Method 2: Custom Platform Admin**

```bash
# Create custom platform admin
npm run admin:create-platform admin@yourcompany.com password123 "Your Name"
```

### **Method 3: Using Admin Manager**

```bash
# List all admins
npm run admin:list

# Create different admin types
npm run admin:create-platform    # Platform admin
npm run admin:create-store-owner # Store owner
npm run admin:create-store-admin # Store admin

# Manage admins
npm run admin:delete admin@example.com
npm run admin:reset-password admin@example.com newpassword123
```

## 🔧 **MongoDB Atlas Configuration**

### **Network Access**

1. **Go to Network Access** in Atlas dashboard
2. **Add IP Address**:
   - For development: Add your current IP
   - For production: Add `0.0.0.0/0` (allows all IPs)
   - For Render deployment: Add Render's IP ranges

### **Database Access**

1. **Go to Database Access** in Atlas dashboard
2. **Create Database User**:
   - Username: `griffin-admin`
   - Password: `secure-password`
   - Role: `Atlas admin` or `Read and write to any database`

### **Cluster Configuration**

1. **Choose the right cluster tier**:
   - **Free tier**: Good for development and testing
   - **M0**: Shared clusters, 512MB storage
   - **M10+**: Dedicated clusters for production

2. **Enable backups** (recommended for production)

## 🛠️ **Troubleshooting MongoDB Atlas**

### **Issue: "Authentication failed"**

**Solutions**:
1. **Check username/password**:
   ```bash
   # Verify in Atlas dashboard
   # Database Access > Users
   ```

2. **Reset database password**:
   - Go to Database Access in Atlas
   - Edit user
   - Reset password
   - Update your connection string

3. **Check user permissions**:
   - Ensure user has `readWrite` or `atlasAdmin` role

### **Issue: "Network timeout"**

**Solutions**:
1. **Check Network Access**:
   - Go to Network Access in Atlas
   - Add your current IP address
   - Or add `0.0.0.0/0` for all IPs

2. **Check firewall settings**:
   - Ensure port 27017 is not blocked
   - Check corporate firewall policies

3. **Try different connection string format**:
   ```bash
   # Standard format
   mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority
   
   # Alternative format
   mongodb://username:password@cluster-shard-00-00.mongodb.net:27017,cluster-shard-00-01.mongodb.net:27017,cluster-shard-00-02.mongodb.net:27017/griffin?ssl=true&replicaSet=atlas-xxxxx&authSource=admin
   ```

### **Issue: "Connection string not found"**

**Solutions**:
1. **Check .env file location**:
   ```bash
   # Should be in backend directory
   ls -la backend/.env
   ```

2. **Verify environment variable**:
   ```bash
   # Check if DB_URL is set
   echo $DB_URL
   ```

3. **Restart your application**:
   ```bash
   # Stop and restart
   npm run dev
   ```

### **Issue: "Database not found"**

**Solutions**:
1. **Database will be created automatically** when you first connect
2. **Check connection string** includes database name:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority
   ```
   Note the `/griffin` part

## 📊 **MongoDB Atlas Monitoring**

### **Monitor Your Database**

1. **Go to Metrics** in Atlas dashboard
2. **Key metrics to watch**:
   - Connection count
   - Operation count
   - Query performance
   - Storage usage

### **Set Up Alerts**

1. **Go to Alerts** in Atlas dashboard
2. **Create alerts for**:
   - Connection count > 80%
   - Storage usage > 80%
   - Slow queries

## 🔐 **Security Best Practices**

### **1. Use Strong Passwords**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Avoid common words

### **2. Restrict Network Access**
- Only allow necessary IP addresses
- Use VPC peering for production
- Regularly review IP access list

### **3. Use Database Users**
- Create specific users for your application
- Don't use the admin user
- Grant minimum required permissions

### **4. Enable Encryption**
- Atlas provides encryption at rest by default
- Use TLS/SSL for connections
- Enable client-side encryption for sensitive data

## 🚀 **Production Deployment**

### **For Render Deployment**

1. **Set environment variables in Render**:
   - Go to your service dashboard
   - Environment tab
   - Add `DB_URL` with your Atlas connection string

2. **Network Access**:
   - Add Render's IP ranges to Atlas Network Access
   - Or use `0.0.0.0/0` for all IPs

3. **Database User**:
   - Create a dedicated user for production
   - Use strong password
   - Grant appropriate permissions

### **For Other Platforms**

1. **Set `DB_URL` environment variable**
2. **Add platform IPs to Network Access**
3. **Use production-grade cluster** (M10+)

## 📚 **Useful Commands**

### **Test Connection**
```bash
# Test database connection
npm run dev

# Check admin creation
npm run create-admin

# List all admins
npm run admin:list
```

### **Database Management**
```bash
# Create platform admin
npm run admin:create-platform admin@company.com password123 "Admin Name"

# Create store owner
npm run admin:create-store-owner owner@store.com password123 "Store Owner"

# Create store admin
npm run admin:create-store-admin admin@store.com password123 "Store Admin"

# Delete admin
npm run admin:delete admin@example.com

# Reset password
npm run admin:reset-password admin@example.com newpassword123
```

## 🎯 **Next Steps**

After setting up MongoDB Atlas:

1. **Create your first platform admin**
2. **Test the connection** with the admin scripts
3. **Login to Swagger UI** and test the API
4. **Create some test stores** to understand the workflow
5. **Set up monitoring** and alerts in Atlas
6. **Configure backups** for production

## 📞 **Support**

If you encounter issues:

1. **Check Atlas documentation**: [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
2. **Verify connection string** format
3. **Check Network Access** settings
4. **Review Database Access** permissions
5. **Check application logs** for detailed error messages 