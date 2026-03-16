# Environment Setup Guide

## 🚨 **Critical Issue Found: Missing Environment Variables**

The error you're experiencing is because the `JWT_SECRET` environment variable is not set. This is required for JWT token generation and verification.

## 📋 **Required Environment Variables**

You need to create a `.env` file in the `backend` directory with the following variables:

### **Essential Variables (Required)**

```bash
# Database Configuration
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority

# JWT Configuration (CRITICAL - This was missing!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=development
```

### **Optional Variables (For Advanced Features)**

```bash
# Cloudinary Configuration (if using image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Security Configuration
BCRYPT_ROUNDS=10
SESSION_SECRET=your-session-secret-key

# API Configuration
API_VERSION=v1
API_PREFIX=/api

# Store Configuration
MAX_STORES_PER_USER=5
MAX_PRODUCTS_PER_STORE=1000
MAX_CATEGORIES_PER_STORE=50
```

## 🔧 **Setup Instructions**

### **Step 1: Create the .env file**

```bash
# Navigate to the backend directory
cd backend

# Create the .env file
touch .env
```

### **Step 2: Add the essential variables**

Open the `.env` file and add at minimum:

```bash
# Replace with your actual MongoDB Atlas connection string
DB_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/griffin?retryWrites=true&w=majority

# Generate a strong secret key (you can use any random string)
JWT_SECRET=my-super-secret-jwt-key-2024-change-this-in-production

# Server port
PORT=3001
NODE_ENV=development
```

### **Step 3: Generate a Strong JWT Secret**

You can generate a strong JWT secret using Node.js:

```bash
# In your terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use a simple but secure string like:
```
JWT_SECRET=griffin-ecommerce-platform-secret-key-2024-production-ready
```

## 🧪 **Test the Setup**

After creating the `.env` file, test it:

```bash
# Test JWT functionality
npm run debug-jwt

# Test database connection
npm run test-db

# Test store creation
npm run test-store
```

## 🔍 **Verification Steps**

### **1. Check Environment Variables**
```bash
# In your Node.js application
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('DB_URL exists:', !!process.env.DB_URL);
```

### **2. Test JWT Token Generation**
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 'test', email: 'test@example.com' },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

console.log('Token generated:', !!token);
```

### **3. Test Database Connection**
```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection failed:', err));
```

## 🛠️ **Troubleshooting**

### **Issue 1: "JWT_SECRET is not defined"**
**Solution**: Make sure your `.env` file is in the `backend` directory and contains `JWT_SECRET=your-secret-key`

### **Issue 2: "DB_URL is not defined"**
**Solution**: 
1. Check your MongoDB Atlas connection string
2. Ensure it's properly formatted
3. Test the connection with `npm run test-db`

### **Issue 3: ".env file not being read"**
**Solutions**:
1. Make sure the file is named exactly `.env` (not `.env.txt`)
2. Ensure it's in the `backend` directory
3. Restart your server after creating the file
4. Check that `require('dotenv').config()` is called early in your app

### **Issue 4: "Invalid MongoDB connection string"**
**Solution**: 
1. Get your connection string from MongoDB Atlas dashboard
2. Replace `username`, `password`, and `cluster` with your actual values
3. Test with `npm run test-db`

## 📁 **File Structure**

Your project should look like this:
```
griffin/
├── backend/
│   ├── .env                    ← Create this file
│   ├── server.js
│   ├── app.js
│   └── ...
├── package.json
└── ...
```

## 🎯 **Quick Fix**

For immediate testing, create the `.env` file with just these essential variables:

```bash
# backend/.env
DB_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/griffin?retryWrites=true&w=majority
JWT_SECRET=griffin-secret-key-2024
PORT=3001
NODE_ENV=development
```

Then restart your server and test store creation again!

## 🔒 **Security Notes**

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** in production
3. **Rotate secrets regularly** in production environments
4. **Use environment-specific configurations** (dev/staging/prod)

## 📚 **Related Documentation**

- [MongoDB Atlas Setup](./MONGODB_ATLAS_SETUP.md) - Database setup guide
- [Store Creation Guide](./STORE_CREATION_GUIDE.md) - Complete store creation process
- [JWT Authentication Guide](./SWAGGER_AUTHENTICATION_GUIDE.md) - Authentication setup

---

**After setting up the `.env` file, your store creation should work correctly!** 🚀 