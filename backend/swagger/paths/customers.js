/**
 * Customer API endpoints documentation.
 * - /admin/customers: Admin UI (store customer management)
 * - /api/customers: Customer-facing API (auth, profile, wishlist, etc.)
 */

const customerPaths = {
  // ----- Admin customer management -----
  '/admin/customers': {
    get: {
      tags: ['Customers - Admin'],
      summary: 'List customers (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Customers page rendered' },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    post: {
      tags: ['Customers - Admin'],
      summary: 'Create customer (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: { required: false, content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } },
      responses: {
        201: { description: 'Customer created successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/customers/{id}': {
    get: {
      tags: ['Customers - Admin'],
      summary: 'Get customer details (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      responses: {
        200: { description: 'Customer details page rendered' },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    put: {
      tags: ['Customers - Admin'],
      summary: 'Update customer (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      requestBody: { required: false, content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } },
      responses: {
        200: { description: 'Customer updated successfully' },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    delete: {
      tags: ['Customers - Admin'],
      summary: 'Delete customer (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      responses: {
        200: { description: 'Customer deleted successfully' },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  // ----- Customer-facing API -----
  '/api/customers/register': {
    post: {
      tags: ['Customers'],
      summary: 'Register a new customer',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password', 'phone'],
              properties: {
                name: { type: 'string', example: 'Jane Smith' },
                email: { type: 'string', format: 'email', example: 'jane@example.com' },
                password: { type: 'string', minLength: 6, example: 'password123' },
                phone: { type: 'string', example: '+1234567890' },
                dateOfBirth: { type: 'string', format: 'date', example: '1990-01-01' },
                gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'], example: 'female' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Customer registered successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Customer' },
                  token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                },
              },
            },
          },
        },
        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        409: { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/customers/login': {
    post: {
      tags: ['Customers'],
      summary: 'Customer login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'jane@example.com' },
                password: { type: 'string', example: 'password123' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Customer' },
                  token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                },
              },
            },
          },
        },
        401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/customers/session': {
    get: {
      tags: ['Customers'],
      summary: 'Sync session cookie from Bearer token',
      description: 'If Authorization Bearer token is valid, sets customerToken cookie so server-rendered pages can show customer name.',
      security: [],
      responses: {
        204: { description: 'Cookie set or no token' },
      },
    },
  },

  '/api/customers/logout': {
    get: {
      tags: ['Customers'],
      summary: 'Log out customer',
      description: 'Clears the customerToken cookie. Call before redirecting to sign-in.',
      security: [],
      responses: {
        204: { description: 'Cookie cleared' },
      },
    },
  },

  '/api/customers/profile': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Customer profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Customer' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    put: {
      tags: ['Customers'],
      summary: 'Update customer profile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
                dateOfBirth: { type: 'string', format: 'date' },
                gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
                preferences: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Profile updated successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/customers/addresses': {
    post: {
      tags: ['Customers'],
      summary: 'Add customer address',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'street', 'city', 'state', 'zipCode', 'country'],
              properties: {
                type: { type: 'string', enum: ['billing', 'shipping', 'both'], example: 'both' },
                isDefault: { type: 'boolean', example: true },
                street: { type: 'string', example: '123 Main St' },
                apartment: { type: 'string', example: 'Apt 4B' },
                city: { type: 'string', example: 'New York' },
                state: { type: 'string', example: 'NY' },
                zipCode: { type: 'string', example: '10001' },
                country: { type: 'string', example: 'US' },
                phone: { type: 'string', example: '+1234567890' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Address added successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/customers/addresses/{addressId}': {
    put: {
      tags: ['Customers'],
      summary: 'Update customer address',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'addressId', required: true, schema: { type: 'string' }, description: 'Address ID' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['billing', 'shipping', 'both'] },
                isDefault: { type: 'boolean' },
                street: { type: 'string' },
                apartment: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' },
                phone: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Address updated successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Address not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    delete: {
      tags: ['Customers'],
      summary: 'Remove customer address',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'addressId', required: true, schema: { type: 'string' }, description: 'Address ID' }],
      responses: {
        200: { description: 'Address removed successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Address not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/customers/wishlist': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer wishlist',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Customer wishlist',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        product: { $ref: '#/components/schemas/Product' },
                        store: { $ref: '#/components/schemas/Store' },
                        addedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    post: {
      tags: ['Customers'],
      summary: 'Add product to wishlist',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productId', 'storeId'],
              properties: {
                productId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                storeId: { type: 'string', example: '507f1f77bcf86cd799439012' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Product added to wishlist', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Product or store not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/customers/wishlist/{productId}/{storeId}': {
    delete: {
      tags: ['Customers'],
      summary: 'Remove product from wishlist',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'productId', required: true, schema: { type: 'string' }, description: 'Product ID' },
        { in: 'path', name: 'storeId', required: true, schema: { type: 'string' }, description: 'Store ID' },
      ],
      responses: {
        200: { description: 'Product removed from wishlist', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Product not found in wishlist', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/customers/recently-viewed': {
    get: {
      tags: ['Customers'],
      summary: 'Get recently viewed products',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Recently viewed products',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        product: { $ref: '#/components/schemas/Product' },
                        store: { $ref: '#/components/schemas/Store' },
                        viewedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/customers/metrics': {
    post: {
      tags: ['Customers'],
      summary: 'Update customer metrics',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orderTotal'],
              properties: {
                orderTotal: { type: 'number', example: 99.99 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Metrics updated successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
};

module.exports = customerPaths;
