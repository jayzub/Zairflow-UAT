# Multi-Tenant Ecommerce Platform API Documentation

## Overview

This document provides comprehensive documentation for the Multi-Tenant Ecommerce Platform API. The API allows store owners to create and manage their own ecommerce stores, while customers can browse and purchase products across multiple stores.

## Quick Start

### 1. Access Swagger Documentation

Once the server is running, you can access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

This provides a complete interactive interface where you can:
- Browse all available endpoints
- Test API calls directly from the browser
- View request/response schemas
- Authenticate and use protected endpoints

### 2. Base URL

All API endpoints are prefixed with:
```
http://localhost:3000/api/v1
```

### 3. Authentication

The API uses JWT (JSON Web Tokens) for authentication. There are two types of users:

- **Admin Users**: Store owners and administrators
- **Customer Users**: Shoppers who browse and purchase products

#### Admin Authentication

```bash
# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Use the returned token in subsequent requests
curl -X GET http://localhost:3000/api/v1/stores/my-stores \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Customer Authentication

```bash
# Register as customer
curl -X POST http://localhost:3000/api/v1/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'

# Login as customer
curl -X POST http://localhost:3000/api/v1/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

## API Endpoints

### Authentication

#### Admin Authentication
- `POST /auth/login` - Admin login
- `POST /auth/register` - Admin registration
- `POST /auth/logout` - Admin logout
- `POST /auth/refresh` - Refresh admin token

#### Customer Authentication
- `POST /customers/register` - Customer registration
- `POST /customers/login` - Customer login
- `POST /customers/logout` - Customer logout

### Stores

#### Public Endpoints
- `GET /stores/discover` - Discover public stores

#### Protected Endpoints (Admin)
- `POST /stores` - Create a new store
- `GET /stores/my-stores` - Get user's stores
- `GET /stores/:id` - Get store details
- `PUT /stores/:id` - Update store
- `DELETE /stores/:id` - Delete store (soft delete)
- `GET /stores/:id/analytics` - Get store analytics
- `POST /stores/:id/admins` - Add admin to store
- `DELETE /stores/:id/admins` - Remove admin from store
- `GET /stores/:id/settings` - Get store settings
- `PUT /stores/:id/settings` - Update store settings
- `GET /stores/:id/theme` - Get store theme
- `PUT /stores/:id/theme` - Update store theme

### Products

#### Public Endpoints
- `GET /products` - Get products (with store filtering)
- `GET /products/:id` - Get product details
- `GET /products/search` - Search products

#### Protected Endpoints (Admin)
- `POST /products` - Create a new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `POST /products/:id/reviews` - Create product review (Customer)
- `DELETE /products/:id/reviews/:reviewId` - Delete product review

### Categories

#### Public Endpoints
- `GET /categories` - Get categories (with store filtering)
- `GET /categories/:id` - Get category details

#### Protected Endpoints (Admin)
- `POST /categories` - Create a new category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Orders

#### Protected Endpoints (Admin)
- `GET /orders` - Get orders (with store filtering)
- `GET /orders/:id` - Get order details
- `POST /orders` - Create a new order
- `PUT /orders/:id` - Update order status
- `DELETE /orders/:id` - Delete order

#### Protected Endpoints (Customer)
- `GET /orders/my-orders` - Get customer's orders
- `POST /orders` - Place a new order

### Customers

#### Public Endpoints
- `POST /customers/register` - Customer registration
- `POST /customers/login` - Customer login

#### Protected Endpoints (Customer)
- `GET /customers/profile` - Get customer profile
- `PUT /customers/profile` - Update customer profile
- `POST /customers/addresses` - Add customer address
- `PUT /customers/addresses/:addressId` - Update customer address
- `DELETE /customers/addresses/:addressId` - Remove customer address
- `GET /customers/wishlist` - Get customer wishlist
- `POST /customers/wishlist` - Add product to wishlist
- `DELETE /customers/wishlist/:productId/:storeId` - Remove product from wishlist
- `GET /customers/recently-viewed` - Get recently viewed products
- `POST /customers/metrics` - Update customer metrics

### Platform Administration

#### Protected Endpoints (Platform Admin)
- `GET /platform/overview` - Get platform overview
- `GET /platform/analytics` - Get platform analytics
- `GET /platform/stores` - Get all stores
- `GET /platform/stores/:storeId` - Get store details
- `PUT /platform/stores/:storeId/subscription` - Update store subscription
- `PUT /platform/stores/:storeId/verify` - Verify store
- `PUT /platform/stores/:storeId/status` - Toggle store status

## Multi-Tenancy Features

### Store Isolation

All data is isolated by store. When making API calls, the system automatically filters data based on the store context:

1. **Subdomain Routing**: `{store-slug}.yourdomain.com`
2. **Header-based Routing**: `x-store-slug` header
3. **Query Parameter Routing**: `?storeSlug=store-name`
4. **Path Parameter Routing**: `/stores/{storeId}/products`

### Example: Store-Specific Product Listing

```bash
# Using subdomain
curl -X GET https://my-store.yourdomain.com/api/v1/products

# Using header
curl -X GET http://localhost:3000/api/v1/products \
  -H "x-store-slug: my-store"

# Using query parameter
curl -X GET "http://localhost:3000/api/v1/products?storeSlug=my-store"
```

## Data Models

### Store Model

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "My Awesome Store",
  "slug": "my-awesome-store",
  "description": "A great store for awesome products",
  "owner": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "contactInfo": {
    "email": "contact@my-store.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "US"
    }
  },
  "settings": {
    "currency": "USD",
    "timezone": "UTC",
    "language": "en",
    "taxRate": 0,
    "shippingEnabled": true,
    "reviewsEnabled": true
  },
  "theme": {
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "fontFamily": "Arial, sans-serif"
  },
  "subscription": {
    "plan": "premium",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z",
    "features": ["unlimited_products", "analytics", "custom_domain"]
  },
  "isActive": true,
  "isVerified": false,
  "dateCreated": "2024-01-01T00:00:00.000Z",
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### Product Model

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "store": "507f1f77bcf86cd799439011",
  "name": "Amazing Product",
  "description": "This is an amazing product description",
  "image": {
    "url": "https://example.com/image.jpg",
    "public_id": "products/image_123"
  },
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "public_id": "products/image_1"
    }
  ],
  "brand": "Brand Name",
  "tags": ["electronics", "gadgets"],
  "price": 99.99,
  "salePrice": 79.99,
  "category": ["507f1f77bcf86cd799439014"],
  "rating": 4.5,
  "numReviews": 25,
  "isFeatured": false,
  "isActive": true,
  "countInStock": 100,
  "productType": "Electronics",
  "slug": "amazing-product",
  "dateCreated": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Customer Model

```json
{
  "_id": "507f1f77bcf86cd799439015",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "avatar": {
    "url": "https://example.com/avatar.jpg",
    "public_id": "avatars/avatar_123"
  },
  "dateOfBirth": "1990-01-01",
  "gender": "female",
  "addresses": [
    {
      "type": "both",
      "isDefault": true,
      "street": "123 Main St",
      "apartment": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "US",
      "phone": "+1234567890"
    }
  ],
  "preferences": {
    "language": "en",
    "currency": "USD",
    "timezone": "UTC",
    "theme": "light",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "marketing": true
    }
  },
  "wishlist": [
    {
      "product": "507f1f77bcf86cd799439013",
      "store": "507f1f77bcf86cd799439011",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "metrics": {
    "totalOrders": 25,
    "totalSpent": 1500,
    "averageOrderValue": 60,
    "lastOrderDate": "2024-01-01T00:00:00.000Z",
    "favoriteCategories": ["Electronics", "Clothing"],
    "favoriteStores": [
      {
        "store": "507f1f77bcf86cd799439011",
        "orderCount": 10,
        "totalSpent": 800
      }
    ]
  },
  "isActive": true,
  "isVerified": true,
  "emailVerified": true,
  "phoneVerified": false,
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

The API uses standard HTTP status codes and returns consistent error responses:

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

### Example Error Responses

```json
// 400 Bad Request
{
  "success": false,
  "error": "Validation failed",
  "message": "Email is required",
  "code": "VALIDATION_ERROR"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required",
  "message": "Please provide a valid JWT token",
  "code": "AUTH_REQUIRED"
}

// 403 Forbidden
{
  "success": false,
  "error": "Access denied",
  "message": "You don't have permission to access this resource",
  "code": "ACCESS_DENIED"
}

// 404 Not Found
{
  "success": false,
  "error": "Resource not found",
  "message": "Store with ID 507f1f77bcf86cd799439011 not found",
  "code": "NOT_FOUND"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Public endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 1000 requests per minute per user
- **Admin endpoints**: 5000 requests per minute per admin

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Pagination Response Format

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

### Filtering

```bash
# Filter products by category
GET /products?category=electronics

# Filter products by price range
GET /products?minPrice=10&maxPrice=100

# Filter products by rating
GET /products?minRating=4

# Search products
GET /products?search=smartphone
```

### Sorting

```bash
# Sort by price (ascending)
GET /products?sort=price&order=asc

# Sort by rating (descending)
GET /products?sort=rating&order=desc

# Sort by date created (newest first)
GET /products?sort=dateCreated&order=desc
```

## Webhooks

The API supports webhooks for real-time notifications:

### Available Webhooks

- `order.created` - When a new order is created
- `order.updated` - When an order status changes
- `product.created` - When a new product is created
- `product.updated` - When a product is updated
- `customer.registered` - When a new customer registers

### Webhook Configuration

```json
{
  "url": "https://your-domain.com/webhooks",
  "events": ["order.created", "order.updated"],
  "secret": "your-webhook-secret"
}
```

## SDKs and Libraries

### JavaScript/Node.js

```javascript
// Using fetch
const response = await fetch('http://localhost:3000/api/v1/stores', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'My Store',
    description: 'A great store'
  })
});

const data = await response.json();
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3000/api/v1/stores',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    },
    json={
        'name': 'My Store',
        'description': 'A great store'
    }
)

data = response.json()
```

### cURL Examples

```bash
# Create a store
curl -X POST http://localhost:3000/api/v1/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Store",
    "description": "A great store",
    "contactInfo": {
      "email": "contact@mystore.com"
    }
  }'

# Get products
curl -X GET "http://localhost:3000/api/v1/products?page=1&limit=20" \
  -H "x-store-slug: my-store"

# Create a product
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-store-slug: my-store" \
  -d '{
    "name": "Amazing Product",
    "description": "This is amazing",
    "price": 99.99,
    "category": ["electronics"]
  }'
```

## Testing

### Using Swagger UI

1. Start the server: `npm run dev`
2. Open `http://localhost:3000/api-docs`
3. Click "Authorize" and enter your JWT token
4. Test endpoints directly from the interface

### Using Postman

1. Import the API collection (if available)
2. Set up environment variables for base URL and tokens
3. Use the collection to test all endpoints

### Automated Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=stores.test.js
```

## Deployment

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure MongoDB connection string
- [ ] Set secure JWT secret
- [ ] Configure Cloudinary credentials
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

## Support

For API support and questions:

- **Documentation**: Visit `/api-docs` for interactive documentation
- **Issues**: Report bugs and feature requests via GitHub issues
- **Email**: support@example.com

## Changelog

### v1.0.0 (2024-01-01)
- Initial release
- Multi-tenant store management
- Product and category management
- Customer authentication and profiles
- Order management
- Platform administration
- Swagger documentation 