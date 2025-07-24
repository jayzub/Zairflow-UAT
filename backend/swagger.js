const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Tenant Ecommerce Platform API',
      version: '1.0.0',
      description: 'A comprehensive API for managing multi-tenant ecommerce stores',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://your-domain.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        // Store Schemas
        Store: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'My Awesome Store' },
            slug: { type: 'string', example: 'my-awesome-store' },
            description: { type: 'string', example: 'A great store for awesome products' },
            owner: { $ref: '#/components/schemas/User' },
            admins: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            contactInfo: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zipCode: { type: 'string' },
                    country: { type: 'string' }
                  }
                }
              }
            },
            settings: {
              type: 'object',
              properties: {
                currency: { type: 'string', example: 'USD' },
                timezone: { type: 'string', example: 'UTC' },
                language: { type: 'string', example: 'en' },
                taxRate: { type: 'number', example: 0 },
                shippingEnabled: { type: 'boolean', example: true },
                reviewsEnabled: { type: 'boolean', example: true }
              }
            },
            theme: {
              type: 'object',
              properties: {
                primaryColor: { type: 'string', example: '#007bff' },
                secondaryColor: { type: 'string', example: '#6c757d' },
                fontFamily: { type: 'string', example: 'Arial, sans-serif' }
              }
            },
            subscription: {
              type: 'object',
              properties: {
                plan: { type: 'string', enum: ['free', 'basic', 'premium', 'enterprise'] },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                features: { type: 'array', items: { type: 'string' } }
              }
            },
            analytics: {
              type: 'object',
              properties: {
                totalSales: { type: 'number', example: 15000 },
                totalOrders: { type: 'number', example: 150 },
                totalProducts: { type: 'number', example: 50 },
                totalCustomers: { type: 'number', example: 300 }
              }
            },
            isActive: { type: 'boolean', example: true },
            isVerified: { type: 'boolean', example: false },
            dateCreated: { type: 'string', format: 'date-time' },
            lastUpdated: { type: 'string', format: 'date-time' }
          }
        },
        
        // User Schemas (Admin)
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            avatar: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                public_id: { type: 'string' }
              }
            },
            role: { 
              type: 'string', 
              enum: ['store_owner', 'store_admin', 'platform_admin'],
              example: 'store_owner'
            },
            position: { type: 'string', example: 'Store Manager' },
            department: { type: 'string', example: 'Sales' },
            permissions: { 
              type: 'array', 
              items: { 
                type: 'string',
                enum: [
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
              }
            },
            ownedStores: { type: 'array', items: { $ref: '#/components/schemas/Store' } },
            adminStores: { type: 'array', items: { $ref: '#/components/schemas/Store' } },
            isPlatformAdmin: { type: 'boolean', example: false },
            isActive: { type: 'boolean', example: true },
            isVerified: { type: 'boolean', example: true },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Customer Schemas
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            avatar: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                public_id: { type: 'string' }
              }
            },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { 
              type: 'string', 
              enum: ['male', 'female', 'other', 'prefer_not_to_say'],
              example: 'female'
            },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { 
                    type: 'string', 
                    enum: ['billing', 'shipping', 'both'],
                    example: 'both'
                  },
                  isDefault: { type: 'boolean', example: true },
                  street: { type: 'string', example: '123 Main St' },
                  apartment: { type: 'string', example: 'Apt 4B' },
                  city: { type: 'string', example: 'New York' },
                  state: { type: 'string', example: 'NY' },
                  zipCode: { type: 'string', example: '10001' },
                  country: { type: 'string', example: 'US' },
                  phone: { type: 'string', example: '+1234567890' }
                }
              }
            },
            preferences: {
              type: 'object',
              properties: {
                language: { type: 'string', example: 'en' },
                currency: { type: 'string', example: 'USD' },
                timezone: { type: 'string', example: 'UTC' },
                theme: { type: 'string', example: 'light' },
                notifications: {
                  type: 'object',
                  properties: {
                    email: { type: 'boolean', example: true },
                    push: { type: 'boolean', example: true },
                    sms: { type: 'boolean', example: false },
                    marketing: { type: 'boolean', example: true }
                  }
                }
              }
            },
            wishlist: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { $ref: '#/components/schemas/Product' },
                  store: { $ref: '#/components/schemas/Store' },
                  addedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                totalOrders: { type: 'number', example: 25 },
                totalSpent: { type: 'number', example: 1500 },
                averageOrderValue: { type: 'number', example: 60 },
                lastOrderDate: { type: 'string', format: 'date-time' },
                favoriteCategories: { type: 'array', items: { type: 'string' } },
                favoriteStores: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      store: { $ref: '#/components/schemas/Store' },
                      orderCount: { type: 'number', example: 10 },
                      totalSpent: { type: 'number', example: 800 }
                    }
                  }
                }
              }
            },
            isActive: { type: 'boolean', example: true },
            isVerified: { type: 'boolean', example: true },
            emailVerified: { type: 'boolean', example: true },
            phoneVerified: { type: 'boolean', example: false },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Product Schemas
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            store: { $ref: '#/components/schemas/Store' },
            name: { type: 'string', example: 'Amazing Product' },
            description: { type: 'string', example: 'This is an amazing product description' },
            image: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                public_id: { type: 'string' }
              }
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  public_id: { type: 'string' }
                }
              }
            },
            brand: { type: 'string', example: 'Brand Name' },
            tags: { type: 'array', items: { type: 'string' } },
            price: { type: 'number', example: 99.99 },
            salePrice: { type: 'number', example: 79.99 },
            category: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            vendor: { $ref: '#/components/schemas/Vendor' },
            reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
            rating: { type: 'number', example: 4.5 },
            numReviews: { type: 'number', example: 25 },
            isFeatured: { type: 'boolean', example: false },
            isActive: { type: 'boolean', example: true },
            countInStock: { type: 'number', example: 100 },
            productType: { type: 'string', example: 'Electronics' },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            slug: { type: 'string', example: 'amazing-product' },
            dateCreated: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Category Schemas
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            store: { $ref: '#/components/schemas/Store' },
            name: { type: 'string', example: 'Electronics' },
            slug: { type: 'string', example: 'electronics' },
            description: { type: 'string', example: 'Electronic devices and gadgets' },
            icon: { type: 'string', example: 'default-icon.png' },
            color: { type: 'string', example: '#000000' },
            image: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                public_id: { type: 'string' }
              }
            },
            parent: { $ref: '#/components/schemas/Category' },
            allowedProductTypes: { 
              type: 'array', 
              items: { 
                type: 'string',
                enum: ['Electronics', 'Clothing', 'Furniture']
              }
            },
            attributes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { 
                    type: 'string',
                    enum: ['string', 'number', 'boolean', 'date', 'object', 'array']
                  },
                  required: { type: 'boolean' },
                  unit: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            displayOrder: { type: 'number', example: 1 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Vendor Schemas
        Vendor: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Vendor Name' },
            description: { type: 'string', example: 'Vendor description' },
            email: { type: 'string', format: 'email', example: 'vendor@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            address: { type: 'string', example: 'Vendor address' },
            isActive: { type: 'boolean', example: true },
            dateCreated: { type: 'string', format: 'date-time' }
          }
        },

        // Review Schemas
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            product: { $ref: '#/components/schemas/Product' },
            customer: { $ref: '#/components/schemas/Customer' },
            rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
            title: { type: 'string', example: 'Great Product!' },
            comment: { type: 'string', example: 'This product exceeded my expectations.' },
            images: { type: 'array', items: { type: 'string' } },
            dateCreated: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Order Schemas
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            store: { $ref: '#/components/schemas/Store' },
            orderNumber: { type: 'string', example: 'ORD-2024-001' },
            orderItems: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            shippingAddress1: { type: 'string', example: '123 Main St' },
            shippingAddress2: { type: 'string', example: 'Apt 4B' },
            city: { type: 'string', example: 'New York' },
            zip: { type: 'string', example: '10001' },
            country: { type: 'string', example: 'US' },
            phone: { type: 'string', example: '+1234567890' },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
              example: 'pending'
            },
            totalPrice: { type: 'number', example: 99.99 },
            subtotal: { type: 'number', example: 89.99 },
            tax: { type: 'number', example: 8.99 },
            shipping: { type: 'number', example: 1.01 },
            discount: { type: 'number', example: 0 },
            customer: { $ref: '#/components/schemas/Customer' },
            customerEmail: { type: 'string', format: 'email', example: 'customer@example.com' },
            customerName: { type: 'string', example: 'John Doe' },
            notes: { type: 'string', example: 'Please deliver after 6 PM' },
            dateOrdered: { type: 'string', format: 'date-time' },
            dateShipped: { type: 'string', format: 'date-time' },
            dateDelivered: { type: 'string', format: 'date-time' },
            trackingNumber: { type: 'string', example: 'TRK123456789' },
            paymentStatus: { 
              type: 'string', 
              enum: ['pending', 'paid', 'failed', 'refunded'],
              example: 'pending'
            },
            paymentMethod: { type: 'string', example: 'credit_card' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // OrderItem Schemas
        OrderItem: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            product: { $ref: '#/components/schemas/Product' },
            quantity: { type: 'number', example: 2 },
            price: { type: 'number', example: 49.99 }
          }
        },

        // Error Schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            message: { type: 'string', example: 'Detailed error message' }
          }
        },

        // Success Response Schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Operation successful' }
          }
        },

        // Pagination Schemas
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 100 },
            pages: { type: 'number', example: 5 }
          }
        }
      }
    },
    tags: [
      {
        name: 'System',
        description: 'System and health check endpoints'
      },
      {
        name: 'Authentication',
        description: 'Authentication endpoints for admins and customers'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Stores',
        description: 'Store management endpoints'
      },
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Categories',
        description: 'Category management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Customers',
        description: 'Customer management endpoints'
      },
      {
        name: 'Reviews',
        description: 'Product review endpoints'
      },
      {
        name: 'Platform',
        description: 'Platform administration endpoints'
      }
    ]
  },
  apis: [
    './backend/routes/*.js',
    './backend/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 