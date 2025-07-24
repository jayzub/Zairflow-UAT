# Store Creation Guide

## Overview

This guide explains how to create stores and store owners in your multi-tenant ecommerce platform.

## 🎯 **Quick Start: Create Store and Owner**

### **Method 1: Using the Script (Easiest)**

```bash
# Create a store owner and store in one go
npm run create-store
```

This creates:
- **Store Owner**: `john@store.com` / `password123`
- **Store**: "John's Electronics Store"
- **Store Slug**: `johns-electronics`

### **Method 2: Using Swagger UI (Interactive)**

1. **Access Swagger UI**: `http://localhost:3001/api-docs`
2. **Create store owner**: `POST /users/register`
3. **Login**: `POST /users/login`
4. **Create store**: `POST /stores`

### **Method 3: Using Postman (API Testing)**

Follow the step-by-step process below.

## 🛠️ **Step-by-Step Process**

### **Step 1: Create a Store Owner**

#### **Using Swagger UI**
1. Go to `http://localhost:3001/api-docs`
2. Find `POST /users/register`
3. Click "Try it out"
4. Enter this data:
```json
{
  "name": "Jane Store Owner",
  "email": "jane@store.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "store_owner",
  "position": "Store Owner",
  "department": "Management"
}
```

#### **Using Postman**
```http
POST http://localhost:3001/api/v1/users/register
Content-Type: application/json

{
  "name": "Jane Store Owner",
  "email": "jane@store.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "store_owner",
  "position": "Store Owner",
  "department": "Management"
}
```

### **Step 2: Login as Store Owner**

#### **Using Swagger UI**
1. Find `POST /users/login`
2. Click "Try it out"
3. Enter credentials:
```json
{
  "email": "jane@store.com",
  "password": "password123"
}
```
4. Copy the JWT token from the response

#### **Using Postman**
```http
POST http://localhost:3001/api/v1/users/login
Content-Type: application/json

{
  "email": "jane@store.com",
  "password": "password123"
}
```

### **Step 3: Create a Store**

#### **Using Swagger UI**
1. Click the "Authorize" button (🔒)
2. Enter: `Bearer YOUR_JWT_TOKEN`
3. Find `POST /stores`
4. Click "Try it out"
5. Enter store data:
```json
{
  "name": "Jane's Fashion Boutique",
  "slug": "janes-fashion-boutique",
  "description": "Trendy fashion boutique for modern women",
  "contactInfo": {
    "email": "contact@janesboutique.com",
    "phone": "+1234567890",
    "address": {
      "street": "456 Fashion Avenue",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90210",
      "country": "USA"
    }
  },
  "settings": {
    "currency": "USD",
    "timezone": "America/Los_Angeles",
    "language": "en",
    "taxRate": 9.5,
    "shippingEnabled": true,
    "reviewsEnabled": true
  },
  "theme": {
    "primaryColor": "#ff6b9d",
    "secondaryColor": "#f8f9fa",
    "fontFamily": "Arial, sans-serif"
  }
}
```

#### **Using Postman**
```http
POST http://localhost:3001/api/v1/stores
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Jane's Fashion Boutique",
  "slug": "janes-fashion-boutique",
  "description": "Trendy fashion boutique for modern women",
  "contactInfo": {
    "email": "contact@janesboutique.com",
    "phone": "+1234567890",
    "address": {
      "street": "456 Fashion Avenue",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90210",
      "country": "USA"
    }
  },
  "settings": {
    "currency": "USD",
    "timezone": "America/Los_Angeles",
    "language": "en",
    "taxRate": 9.5,
    "shippingEnabled": true,
    "reviewsEnabled": true
  },
  "theme": {
    "primaryColor": "#ff6b9d",
    "secondaryColor": "#f8f9fa",
    "fontFamily": "Arial, sans-serif"
  }
}
```

## 📋 **Store Data Structure**

### **Required Fields**
```json
{
  "name": "Store Name",
  "slug": "store-slug",
  "description": "Store description"
}
```

### **Complete Store Structure**
```json
{
  "name": "My Store",
  "slug": "my-store",
  "description": "Store description",
  "contactInfo": {
    "email": "contact@mystore.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  },
  "settings": {
    "currency": "USD",
    "timezone": "America/New_York",
    "language": "en",
    "taxRate": 8.5,
    "shippingEnabled": true,
    "reviewsEnabled": true
  },
  "theme": {
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "fontFamily": "Arial, sans-serif"
  }
}
```

## 🔧 **Store Owner Permissions**

Store owners have these permissions:
- `manage_products` - Create, update, delete products
- `manage_orders` - View and manage orders
- `manage_customers` - View customer data
- `manage_categories` - Create and manage categories
- `manage_store_settings` - Configure store settings
- `view_analytics` - Access store analytics
- `manage_admins` - Add/remove store admins

## 🎨 **Store Themes**

### **Predefined Themes**

#### **Modern Blue**
```json
{
  "primaryColor": "#007bff",
  "secondaryColor": "#6c757d",
  "fontFamily": "Arial, sans-serif"
}
```

#### **Elegant Pink**
```json
{
  "primaryColor": "#ff6b9d",
  "secondaryColor": "#f8f9fa",
  "fontFamily": "Georgia, serif"
}
```

#### **Professional Dark**
```json
{
  "primaryColor": "#343a40",
  "secondaryColor": "#495057",
  "fontFamily": "Helvetica, sans-serif"
}
```

#### **Vibrant Green**
```json
{
  "primaryColor": "#28a745",
  "secondaryColor": "#20c997",
  "fontFamily": "Arial, sans-serif"
}
```

## 🌍 **Store Settings**

### **Currency Options**
- `USD` - US Dollar
- `EUR` - Euro
- `GBP` - British Pound
- `CAD` - Canadian Dollar
- `AUD` - Australian Dollar

### **Timezone Options**
- `America/New_York`
- `America/Los_Angeles`
- `Europe/London`
- `Europe/Paris`
- `Asia/Tokyo`
- `UTC`

### **Language Options**
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian

## 🚀 **After Creating a Store**

### **1. Verify Store Creation**
```bash
# List all stores
curl http://localhost:3001/api/v1/stores/discover
```

### **2. Add Products**
```http
POST http://localhost:3001/api/v1/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

{
  "name": "Sample Product",
  "description": "Product description",
  "price": 29.99,
  "category": ["electronics"],
  "countInStock": 100,
  "store": "STORE_ID_FROM_CREATION"
}
```

### **3. Create Categories**
```http
POST http://localhost:3001/api/v1/categories
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and gadgets",
  "store": "STORE_ID_FROM_CREATION"
}
```

### **4. View Store Analytics**
```http
GET http://localhost:3001/api/v1/stores/STORE_ID/analytics
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🛠️ **Troubleshooting**

### **Issue: "Store owner already exists"**
**Solution**: Use a different email address or delete the existing owner first.

### **Issue: "Store slug already exists"**
**Solution**: Use a unique slug (e.g., "my-store-2" instead of "my-store").

### **Issue: "Unauthorized" when creating store**
**Solution**: Make sure you're logged in as a store owner and using the correct JWT token.

### **Issue: "Invalid store data"**
**Solution**: Check that all required fields are provided and in the correct format.

## 📊 **Store Management Commands**

### **List All Stores**
```bash
curl http://localhost:3001/api/v1/stores/discover
```

### **Get Store Details**
```bash
curl http://localhost:3001/api/v1/stores/STORE_ID
```

### **Update Store**
```http
PUT http://localhost:3001/api/v1/stores/STORE_ID
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated Store Name",
  "description": "Updated description"
}
```

### **Delete Store**
```http
DELETE http://localhost:3001/api/v1/stores/STORE_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🎯 **Next Steps**

After creating your store:

1. **Add products** to your store
2. **Create categories** for organization
3. **Configure store settings** and theme
4. **Add store admins** to help manage the store
5. **Test the customer experience** by creating customer accounts
6. **Set up payment and shipping** options

## 📚 **Related Documentation**

- [Platform Admin Setup](./PLATFORM_ADMIN_SETUP.md) - Creating platform administrators
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Multi-Tenant Architecture](./MULTI_TENANT_ARCHITECTURE.md) - System architecture
- [Route Ordering Guide](./ROUTE_ORDERING_GUIDE.md) - Express.js route organization 