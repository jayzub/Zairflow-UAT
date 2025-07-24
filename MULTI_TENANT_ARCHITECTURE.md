# Multi-Tenant Ecommerce Platform Architecture

## Overview

This document describes the architecture and implementation of a multi-tenant ecommerce platform that allows store owners to create and manage their own stores. The platform provides complete isolation between stores while sharing the same infrastructure.

## Architecture Overview

### 1. Database Architecture
- **Single Database with Tenant Isolation**: All stores share the same database with data isolation through `storeId` fields
- **Compound Indexes**: Optimized queries with store-specific indexes
- **Soft Deletes**: Stores and data can be deactivated rather than permanently deleted

### 2. Tenant Isolation Strategy
- **Store-based Isolation**: Every entity (products, categories, orders) belongs to a specific store
- **Subdomain Routing**: Each store can be accessed via `{store-slug}.yourdomain.com`
- **Header-based Routing**: Alternative routing using custom headers for API calls
- **Query Parameter Routing**: Fallback routing using query parameters

### 3. User Roles and Permissions

#### Admin Users (User Model)
- **Store Owner**: Users who own one or more stores
- **Store Admin**: Users with admin access to specific stores
- **Platform Admin**: Users with access to all stores and platform management

#### Customer Users (Customer Model)
- **Customer**: Regular users who can shop across stores

## Key Components

### 1. Store Model (`backend/models/store.js`)
```javascript
{
  name: String,
  slug: String, // Unique identifier for subdomain routing
  owner: ObjectId, // Reference to User
  admins: [ObjectId], // Array of store admins
  settings: {
    currency: String,
    timezone: String,
    language: String,
    taxRate: Number
  },
  subscription: {
    plan: String, // free, basic, premium, enterprise
    features: [String]
  },
  analytics: {
    totalSales: Number,
    totalOrders: Number,
    totalProducts: Number
  }
}
```

### 2. Updated User Model (`backend/models/user.js`) - Admin Only
```javascript
{
  role: String, // store_owner, store_admin, platform_admin
  ownedStores: [ObjectId], // Stores owned by user
  adminStores: [ObjectId], // Stores where user is admin
  isPlatformAdmin: Boolean,
  permissions: [String], // Specific permissions for admin actions
  position: String, // Job position
  department: String // Department
}
```

### 3. Customer Model (`backend/models/customer.js`) - Customer Only
```javascript
{
  name: String,
  email: String,
  phone: String,
  addresses: [Address], // Multiple addresses with types
  wishlist: [WishlistItem], // Products in wishlist
  recentlyViewed: [Product], // Recently viewed products
  metrics: {
    totalOrders: Number,
    totalSpent: Number,
    averageOrderValue: Number,
    favoriteCategories: [String],
    favoriteStores: [StoreMetrics]
  }
}
```

### 3. Store Isolation Middleware (`backend/middleware/storeIsolation.js`)
- **extractStore**: Extracts store information from request
- **requireStoreAccess**: Validates user access to store
- **addStoreFilter**: Adds store filter to database queries
- **checkStoreLimits**: Validates subscription limits

## API Endpoints

### Store Management (Admin)
```
POST   /api/v1/stores                    # Create new store
GET    /api/v1/stores/my-stores          # Get user's stores
GET    /api/v1/stores/:id                # Get store details
PUT    /api/v1/stores/:id                # Update store
DELETE /api/v1/stores/:id                # Delete store
GET    /api/v1/stores/:id/analytics      # Get store analytics
POST   /api/v1/stores/:id/admins         # Add store admin
DELETE /api/v1/stores/:id/admins         # Remove store admin
```

### Customer Management
```
POST   /api/v1/customers/register        # Register new customer
POST   /api/v1/customers/login           # Customer login
GET    /api/v1/customers/profile         # Get customer profile
PUT    /api/v1/customers/profile         # Update customer profile
POST   /api/v1/customers/addresses       # Add customer address
PUT    /api/v1/customers/addresses/:id   # Update customer address
DELETE /api/v1/customers/addresses/:id   # Remove customer address
GET    /api/v1/customers/wishlist        # Get customer wishlist
POST   /api/v1/customers/wishlist        # Add to wishlist
DELETE /api/v1/customers/wishlist/:productId/:storeId  # Remove from wishlist
GET    /api/v1/customers/recently-viewed # Get recently viewed products
```

### Platform Admin
```
GET    /api/v1/platform/overview         # Platform overview
GET    /api/v1/platform/analytics        # Platform analytics
GET    /api/v1/platform/stores           # All stores
GET    /api/v1/platform/stores/:storeId  # Store details
PUT    /api/v1/platform/stores/:storeId/subscription  # Update subscription
PUT    /api/v1/platform/stores/:storeId/verify        # Verify store
PUT    /api/v1/platform/stores/:storeId/status        # Toggle store status
```

## Store Routing Strategies

### 1. Subdomain Routing
```
store1.yourdomain.com  -> Store with slug "store1"
store2.yourdomain.com  -> Store with slug "store2"
```

### 2. Header-based Routing
```javascript
// API calls with custom header
headers: {
  'x-store-slug': 'store1'
}
```

### 3. Query Parameter Routing
```
/api/v1/products?storeSlug=store1
```

### 4. Path Parameter Routing
```
/api/v1/stores/store1/products
```

## Subscription Plans and Limits

### Free Plan
- 10 products
- 50 orders
- 100 customers
- Basic features

### Basic Plan ($29/month)
- 100 products
- 500 orders
- 1,000 customers
- Advanced features

### Premium Plan ($99/month)
- 1,000 products
- 5,000 orders
- 10,000 customers
- Premium features

### Enterprise Plan (Custom)
- Unlimited products
- Unlimited orders
- Unlimited customers
- All features + custom integrations

## Implementation Guide

### 1. Setting Up a New Store

```javascript
// Create a new store
const storeData = {
  name: "My Awesome Store",
  description: "A great store for awesome products",
  contactInfo: {
    email: "store@example.com",
    phone: "+1234567890"
  },
  settings: {
    currency: "USD",
    timezone: "America/New_York"
  }
};

const response = await fetch('/api/v1/stores', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(storeData)
});
```

### 2. Adding Products to a Store

```javascript
// Products automatically get the store ID from the request context
const productData = {
  name: "Amazing Product",
  description: "This is an amazing product",
  price: 29.99,
  category: ["categoryId1", "categoryId2"]
};

const response = await fetch('/api/v1/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-store-slug': 'my-store'
  },
  body: JSON.stringify(productData)
});
```

### 3. Managing Store Access

```javascript
// Add admin to store
const adminData = {
  email: "admin@example.com"
};

const response = await fetch('/api/v1/stores/storeId/admins', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(adminData)
});
```

## Security Considerations

### 1. Data Isolation
- All queries include store filters
- Users can only access their own stores
- Platform admins have special access

### 2. Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Store-specific permissions

### 3. Rate Limiting
- Per-store rate limiting
- Subscription-based limits
- API usage monitoring

## Deployment Considerations

### 1. Subdomain Setup
```nginx
# Nginx configuration for subdomain routing
server {
    listen 80;
    server_name *.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. SSL Certificates
- Wildcard SSL certificate for subdomains
- Automatic SSL provisioning with Let's Encrypt

### 3. Database Optimization
- Compound indexes for store-specific queries
- Connection pooling
- Read replicas for scaling

## Monitoring and Analytics

### 1. Store Analytics
- Revenue tracking
- Order analytics
- Product performance
- Customer insights

### 2. Platform Analytics
- Overall platform health
- Store growth metrics
- Revenue analytics
- User engagement

### 3. Performance Monitoring
- Store-specific performance metrics
- Database query optimization
- API response times
- Error tracking

## Migration from Single-Tenant

### 1. Database Migration
```javascript
// Migration script to add store references
db.products.updateMany(
  { store: { $exists: false } },
  { $set: { store: "defaultStoreId" } }
);
```

### 2. User Migration
```javascript
// Update existing users to have appropriate roles
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: "customer" } }
);
```

### 3. Data Validation
- Ensure all entities have store references
- Validate user permissions
- Check data integrity

## Best Practices

### 1. Store Management
- Use descriptive store slugs
- Implement proper store validation
- Regular backup and recovery

### 2. Performance
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

### 3. Security
- Regular security audits
- Implement proper logging
- Monitor for suspicious activity

### 4. Scalability
- Horizontal scaling strategies
- Database sharding considerations
- Load balancing for subdomains

## Troubleshooting

### Common Issues

1. **Store Not Found**
   - Check store slug in request
   - Verify store is active
   - Check user permissions

2. **Data Isolation Issues**
   - Ensure store filter is applied
   - Check middleware configuration
   - Verify database indexes

3. **Performance Issues**
   - Check database query optimization
   - Monitor API response times
   - Review caching strategies

## Future Enhancements

### 1. Advanced Features
- Multi-language support per store
- Advanced analytics and reporting
- Custom themes and branding
- API integrations

### 2. Scaling Improvements
- Microservices architecture
- Event-driven architecture
- Advanced caching strategies
- Global CDN deployment

### 3. Business Features
- Subscription management
- Payment processing
- Inventory management
- Customer relationship management 