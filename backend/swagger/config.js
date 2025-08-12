/**
 * Centralized Swagger configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');
const userSchemas = require('./schemas/user');
const commonSchemas = require('./schemas/common');
const storeSchemas = require('./schemas/store');
const categorySchemas = require('./schemas/category');
const userPaths = require('./paths/users');
const storePaths = require('./paths/stores');
const categoryPaths = require('./paths/categories');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Griffin E-commerce API',
      version: '1.0.0',
      description: 'Multi-tenant e-commerce platform API documentation',
      contact: {
        name: 'API Support',
        email: 'support@griffin.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.griffin.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in HTTP-only cookie'
        }
      },
      schemas: {
        // User schemas
        ...userSchemas,
        
        // Common schemas
        ...commonSchemas,
        
        // Store schemas
        ...storeSchemas,
        
        // Category schemas
        ...categorySchemas,
        
        // Additional schemas can be added here
        
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Awesome Product'
            },
            description: {
              type: 'string',
              example: 'This is an awesome product'
            },
            price: {
              type: 'number',
              example: 99.99
            },
            compareAtPrice: {
              type: 'number',
              example: 129.99
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
            category: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            store: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            inStock: {
              type: 'boolean',
              example: true
            },
            stockQuantity: {
              type: 'number',
              example: 100
            },
            sku: {
              type: 'string',
              example: 'PROD-001'
            },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    paths: {
      ...userPaths,
      ...storePaths,
      ...categoryPaths
      // Add other path files here
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
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
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Customers',
        description: 'Customer management endpoints'
      },
      {
        name: 'Categories',
        description: 'Category management endpoints'
      },
      {
        name: 'Categories - Admin',
        description: 'Category administration endpoints (requires authentication)'
      }
    ]
  },
  apis: [
    // Include route files for automatic documentation
    './backend/routes/*.js',
    './backend/swagger/paths/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 