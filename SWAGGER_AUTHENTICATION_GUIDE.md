# Swagger Authentication Management Guide

## Overview

This guide explains how to control authentication requirements for different API endpoints in your Swagger documentation.

## How Authentication Works in Swagger

### 1. **Global Authentication**
When you add `security: - bearerAuth: []` to an endpoint, it requires authentication.

### 2. **Public Endpoints**
When you **don't include** the `security` property, the endpoint is public (no authentication required).

## Making Endpoints Public

### Method 1: Remove Security Property

**Before (Protected):**
```yaml
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
```

**After (Public):**
```yaml
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products (public - no authentication required)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Success
 */
```

### Method 2: Override Global Security

If you have global security applied, you can override it for specific endpoints:

```yaml
/**
 * @swagger
 * /public-endpoint:
 *   get:
 *     summary: Public endpoint
 *     tags: [Public]
 *     security: []  # Empty array removes all security requirements
 *     responses:
 *       200:
 *         description: Success
 */
```

## Current Public Endpoints

### System Endpoints
- `GET /health` - Health check (no auth required)

### Authentication Endpoints
- `POST /users/login` - Admin login (no auth required)
- `POST /users/register` - Admin registration (no auth required)
- `POST /customers/login` - Customer login (no auth required)
- `POST /customers/register` - Customer registration (no auth required)

### Store Endpoints
- `GET /stores/discover` - Discover stores (no auth required)

### Product Endpoints
- `GET /products` - List products (no auth required)
- `GET /products/{id}` - Get product details (no auth required)
- `GET /products/get/featured/{count}` - Featured products (no auth required)
- `GET /products/category/{categoryId}` - Products by category (no auth required)

## Protected Endpoints

### Store Management (Admin Auth Required)
- `POST /stores` - Create store
- `GET /stores/my-stores` - Get user's stores
- `GET /stores/{id}` - Get store details
- `PUT /stores/{id}` - Update store
- `DELETE /stores/{id}` - Delete store
- `GET /stores/{id}/analytics` - Store analytics
- `POST /stores/{id}/admins` - Add admin
- `DELETE /stores/{id}/admins` - Remove admin

### Product Management (Admin Auth Required)
- `POST /products` - Create product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Customer Management (Customer Auth Required)
- `GET /customers/profile` - Get profile
- `PUT /customers/profile` - Update profile
- `POST /customers/addresses` - Add address
- `GET /customers/wishlist` - Get wishlist
- `POST /customers/wishlist` - Add to wishlist

## How to Test

### 1. **Test Public Endpoints**
```bash
# Health check (no token needed)
curl -X GET http://localhost:3001/api/health

# Get products (no token needed)
curl -X GET http://localhost:3001/api/products

# Discover stores (no token needed)
curl -X GET http://localhost:3001/api/stores/discover
```

### 2. **Test Protected Endpoints**
```bash
# First, get a token
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# Then use the token
curl -X GET http://localhost:3001/api/stores/my-stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Swagger UI Testing

### 1. **Public Endpoints**
- Open `http://localhost:3001/api-docs`
- Find endpoints without the 🔒 icon
- Click "Try it out" and execute (no authorization needed)

### 2. **Protected Endpoints**
- Click the "Authorize" button (🔒 icon)
- Enter your JWT token: `Bearer YOUR_TOKEN_HERE`
- Click "Authorize"
- Now you can test protected endpoints

## Common Patterns

### 1. **Mixed Endpoints in Same Route**
```yaml
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get products (public)
 *     tags: [Products]
 *     # No security property = public
 *   post:
 *     summary: Create product (protected)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     # Has security property = protected
 */
```

### 2. **Conditional Authentication**
```yaml
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product (public)
 *     tags: [Products]
 *     # Public read access
 *   put:
 *     summary: Update product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     # Protected write access
 */
```

## Troubleshooting

### Issue: "Access token required" for public endpoints
**Solution:** Check that the endpoint doesn't have a `security` property in its Swagger documentation.

### Issue: Swagger UI itself requires authentication
**Solution:** The Swagger UI route should be placed before the authentication middleware in your app.js.

### Issue: Some endpoints show 🔒 when they shouldn't
**Solution:** Remove the `security` property from the endpoint's Swagger documentation.

## Best Practices

### 1. **Clear Documentation**
Always indicate in the summary whether an endpoint is public or requires authentication:
- `summary: Get products (public - no authentication required)`
- `summary: Create product (admin authentication required)`

### 2. **Consistent Security**
- Use the same security scheme (`bearerAuth`) across all protected endpoints
- Group public and protected endpoints logically

### 3. **Testing Strategy**
- Test public endpoints first (no token needed)
- Get authentication tokens for testing protected endpoints
- Use Swagger UI for interactive testing

### 4. **Security Considerations**
- Keep sensitive operations protected
- Make read-only operations public when appropriate
- Use role-based access control for different user types

## Example: Making an Endpoint Public

If you want to make the store details endpoint public:

**Current (Protected):**
```yaml
/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Get store details
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store details
 */
```

**Modified (Public):**
```yaml
/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Get store details (public - no authentication required)
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store details
 */
```

The key change is **removing the `security` property** to make the endpoint public. 