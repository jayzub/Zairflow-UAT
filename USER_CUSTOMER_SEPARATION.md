# User and Customer Model Separation

## Overview

The application has been updated to separate admin users (User model) from customer users (Customer model) for better organization, security, and functionality.

## Changes Made

### 1. Updated User Model (`backend/models/user.js`)

**Removed:**
- Customer-specific fields (street, apartment, zip, city, country)
- Customer role from enum
- Customer-related functionality

**Added:**
- Admin-specific fields:
  - `position`: Job position
  - `department`: Department
  - `permissions`: Array of specific permissions
- Enhanced security features:
  - `passwordChangedAt`: Track password changes
  - `passwordResetToken` & `passwordResetExpires`: Password reset functionality
  - `twoFactorEnabled` & `twoFactorSecret`: 2FA support
  - `loginHistory`: Track login activity
- Admin-specific methods:
  - `hasPermission(permission)`: Check if user has specific permission
  - `hasStoreAccess(storeId)`: Check store access
  - `isStoreOwner(storeId)`: Check if user owns store
  - `isStoreAdmin(storeId)`: Check if user is store admin
  - `canManageStore(storeId)`: Check if user can manage store

**Role Enum:**
```javascript
enum: ['store_owner', 'store_admin', 'platform_admin']
```

**Permissions:**
```javascript
[
  'manage_products',
  'manage_orders', 
  'manage_customers',
  'manage_categories',
  'manage_store_settings',
  'view_analytics',
  'manage_admins',
  'manage_subscriptions',
  'platform_management'
]
```

### 2. New Customer Model (`backend/models/customer.js`)

**Customer-specific features:**
- Profile information (dateOfBirth, gender)
- Multiple addresses with types (billing, shipping, both)
- Shopping behavior:
  - Wishlist management
  - Recently viewed products
  - Shopping preferences
- Customer metrics:
  - Total orders and spending
  - Average order value
  - Favorite categories and stores
- Security features:
  - Password reset functionality
  - Email verification
  - 2FA support
  - Login history
- Social login support
- Address management methods

**Customer Methods:**
- `getDefaultAddress(type)`: Get default address by type
- `addToWishlist(productId, storeId)`: Add product to wishlist
- `removeFromWishlist(productId, storeId)`: Remove from wishlist
- `addToRecentlyViewed(productId, storeId)`: Track recently viewed
- `updateMetrics(orderTotal)`: Update customer metrics

### 3. Updated References

**Order Model:**
- Changed `customer` field from `User` to `Customer` reference

**Review Model:**
- Changed `user` field to `customer` field
- Updated index from `{ product: 1, user: 1 }` to `{ product: 1, customer: 1 }`

**Controllers Updated:**
- `productController.js`: Updated review methods to use Customer
- `platformController.js`: Added Customer import and metrics
- `storeController.js`: Added Customer import

### 4. New Customer Controller (`backend/controllers/customerController.js`)

**Authentication:**
- `registerCustomer`: Customer registration
- `loginCustomer`: Customer login

**Profile Management:**
- `getCustomerProfile`: Get customer profile
- `updateCustomerProfile`: Update customer profile

**Address Management:**
- `addAddress`: Add new address
- `updateAddress`: Update existing address
- `removeAddress`: Remove address

**Shopping Features:**
- `addToWishlist`: Add product to wishlist
- `removeFromWishlist`: Remove from wishlist
- `getWishlist`: Get customer wishlist
- `getRecentlyViewed`: Get recently viewed products
- `updateCustomerMetrics`: Update customer metrics after order

### 5. Updated Authentication Middleware (`backend/middleware/jwt.js`)

**New Middleware Functions:**
- `requireAuth`: For admin users (User model)
- `requireCustomerAuth`: For customer users (Customer model)
- `verifyToken`: Generic token verification

**Token Types:**
- Admin tokens: `{ id, email, type: 'admin' }`
- Customer tokens: `{ id, email, type: 'customer' }`

### 6. New Customer Routes (`backend/routes/customers.js`)

**Public Routes:**
- `POST /api/customers/register`
- `POST /api/customers/login`

**Protected Routes:**
- Profile management
- Address management
- Wishlist management
- Recently viewed products
- Customer metrics

## Benefits of Separation

### 1. **Better Organization**
- Clear separation between admin and customer functionality
- Easier to maintain and extend each user type
- Reduced complexity in individual models

### 2. **Enhanced Security**
- Different authentication flows for admins and customers
- Role-specific permissions and access control
- Separate security policies for each user type

### 3. **Improved Functionality**
- Customer-specific features (wishlist, recently viewed, addresses)
- Admin-specific features (permissions, store management)
- Better data modeling for each user type

### 4. **Scalability**
- Independent scaling of admin and customer features
- Easier to add new features specific to each user type
- Better performance with targeted queries

## Migration Notes

### For Existing Data:
1. **Existing Users**: Need to be migrated to appropriate roles
   - Platform admins: Set `isPlatformAdmin: true`
   - Store owners: Set `role: 'store_owner'` and add to `ownedStores`
   - Store admins: Set `role: 'store_admin'` and add to `adminStores`

2. **Customer Data**: If you have existing customer data, it needs to be migrated to the new Customer model

### For Frontend:
1. **Authentication**: Update to use appropriate endpoints
   - Admin login: `/api/users/login`
   - Customer login: `/api/customers/login`

2. **Token Handling**: Check token type to determine user type
   - Admin tokens: Use admin features
   - Customer tokens: Use customer features

3. **API Calls**: Use appropriate authentication headers
   - Admin routes: `Authorization: Bearer <admin-token>`
   - Customer routes: `Authorization: Bearer <customer-token>`

## API Usage Examples

### Admin Authentication
```javascript
// Login as admin
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Use admin token for admin operations
const adminResponse = await fetch('/api/stores', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

### Customer Authentication
```javascript
// Register as customer
const response = await fetch('/api/customers/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password, phone })
});

// Use customer token for customer operations
const customerResponse = await fetch('/api/customers/wishlist', {
  headers: { 'Authorization': `Bearer ${customerToken}` }
});
```

## Future Enhancements

### 1. **Customer Features**
- Social login integration
- Email verification flow
- Password reset functionality
- Two-factor authentication
- Customer analytics dashboard

### 2. **Admin Features**
- Advanced permission system
- Admin activity logging
- Bulk operations
- Advanced analytics
- Store management tools

### 3. **Integration Features**
- Customer-to-admin communication
- Order management integration
- Customer support system
- Notification system 