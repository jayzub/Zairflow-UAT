# Admin Controller Documentation

## Overview

The `adminController.js` has been created to separate admin-specific functionality from the general product controller. This provides better organization and separation of concerns between public-facing product operations and admin-only operations.

## Admin Controller Functions

### Product Management

#### `getAllProducts(req, res)`
- **Purpose**: Get all products with admin-specific logic and store isolation
- **Route**: `GET /admin/products`
- **Authentication**: Required
- **Features**:
  - Store isolation (admins only see their store's products)
  - Pagination support
  - AJAX support for infinite scroll
  - Caching for performance
  - Category and price filtering

#### `addProduct(req, res)`
- **Purpose**: Render the add product page with necessary data
- **Route**: `GET /admin/products/add`
- **Authentication**: Required
- **Features**:
  - Loads categories and vendors
  - Provides product type options
  - Prepares form data

#### `createProduct(req, res)`
- **Purpose**: Create a new product
- **Route**: `POST /admin/products`
- **Authentication**: Required
- **Features**:
  - Supports multiple product types (Clothing, Electronics, Furniture)
  - Image upload handling
  - HTML sanitization
  - Store assignment
  - Validation

#### `editProduct(req, res)`
- **Purpose**: Render the edit product page
- **Route**: `GET /admin/products/edit/:id`
- **Authentication**: Required
- **Features**:
  - Loads existing product data
  - Prepares form with current values
  - Handles different product types

#### `updateProduct(req, res)`
- **Purpose**: Update an existing product
- **Route**: `PUT /admin/products/:id`
- **Authentication**: Required
- **Features**:
  - Supports image updates
  - Type-specific field handling
  - Validation and sanitization

#### `removeProduct(req, res)`
- **Purpose**: Soft delete a product (mark as deleted)
- **Route**: `DELETE /admin/products/:id`
- **Authentication**: Required

#### `deleteProduct(req, res)`
- **Purpose**: Hard delete a product (permanently remove)
- **Route**: `DELETE /admin/products/delete/:id`
- **Authentication**: Required
- **Features**:
  - Removes from Cloudinary
  - Permanently deletes from database

### Statistics and Analytics

#### `getProductCount(req, res)`
- **Purpose**: Get total product count
- **Route**: `GET /admin/api/products/count`
- **Authentication**: Required

#### `getFeaturedProducts(req, res)`
- **Purpose**: Get featured products count
- **Route**: `GET /admin/api/products/featured/:count`
- **Authentication**: Required

#### `getDashboardStats(req, res)`
- **Purpose**: Get dashboard statistics
- **Route**: `GET /admin/dashboard/stats`
- **Authentication**: Required
- **Returns**:
  - Total products
  - Featured products
  - Low stock products
  - Total categories

## Route Structure

### Admin Routes (`/admin`)
```
GET    /admin/products                    - Product list page
GET    /admin/products/add                - Add product page
POST   /admin/products                    - Create product
GET    /admin/products/edit/:id           - Edit product page
PUT    /admin/products/:id                - Update product
DELETE /admin/products/:id                - Soft delete product
DELETE /admin/products/delete/:id         - Hard delete product
GET    /admin/dashboard/stats             - Dashboard statistics
GET    /admin/api/products/count          - Product count
GET    /admin/api/products/featured/:count - Featured products
```

### Public Product Routes (`/api/products`)
```
GET    /api/products                   - Public product list
GET    /api/products/:id               - Public product details
GET    /api/products/filter            - Product filter page
GET    /api/products/category/:id      - Products by category
GET    /api/products/test-ajax         - AJAX test endpoint
```

## Key Differences from Product Controller

1. **Store Isolation**: Admin functions include store filtering
2. **Authentication**: All admin routes require authentication
3. **Admin-specific Logic**: Includes admin dashboard statistics
4. **Separate Caching**: Uses `admin_products:` cache keys
5. **Enhanced Security**: Additional validation for admin operations

## Security Features

- **Authentication Required**: All admin routes use `requireAuth` middleware
- **Store Isolation**: Admins can only access their own store's data
- **Input Sanitization**: HTML content is sanitized to prevent XSS
- **File Upload Security**: Multer configuration with file type validation
- **Cloudinary Integration**: Secure image handling and deletion

## Caching Strategy

- **Admin Products**: Cached with `admin_products:` prefix
- **Cache Duration**: 5 minutes (300 seconds)
- **Cache Invalidation**: Cleared when products are created/updated/deleted
- **AJAX Requests**: Not cached to ensure real-time data

## Error Handling

- **Async Handler**: All functions use `asyncHandler` for consistent error handling
- **Validation**: Input validation with meaningful error messages
- **Database Errors**: Proper error responses for database operations
- **File Upload Errors**: Handling for image upload failures 