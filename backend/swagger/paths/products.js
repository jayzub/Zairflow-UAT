/**
 * Product API endpoints documentation (Admin)
 */

const productPaths = {
  '/admin/products': {
    get: {
      tags: ['Products - Admin'],
      summary: 'List products (Admin)',
      description: 'Retrieve products for the current store context. Returns JSON for AJAX requests; HTML for normal page loads.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1 }, example: 1 },
        { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200 }, example: 20 },
        { name: 'sort', in: 'query', required: false, schema: { type: 'string' }, example: 'dateCreated' },
        { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'] }, example: 'desc' },
      ],
      responses: {
        200: {
          description: 'Products retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                  currentPage: { type: 'integer', example: 1 },
                  totalPages: { type: 'integer', example: 5 },
                  hasNextPage: { type: 'boolean', example: true },
                  hasPrevPage: { type: 'boolean', example: false },
                  productCount: { type: 'integer', example: 100 },
                  api: { type: 'string', example: '/api' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    post: {
      tags: ['Products - Admin'],
      summary: 'Create product (Admin)',
      description: 'Create a product for the current store (or a specified store for platform admins).',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                productType: { type: 'string', example: 'Clothing' },
                name: { type: 'string', example: 'T-shirt' },
                description: { type: 'string' },
                category: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
                vendor: { type: 'string' },
              },
              required: ['productType'],
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Product created successfully',
          content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Product' }, message: { type: 'string' } } } } },
        },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/products/{id}': {
    put: {
      tags: ['Products - Admin'],
      summary: 'Update product (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object' } } },
      },
      responses: {
        200: { description: 'Product updated successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    delete: {
      tags: ['Products - Admin'],
      summary: 'Soft delete product (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      responses: {
        200: { description: 'Product marked as deleted successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/products/delete/{id}': {
    delete: {
      tags: ['Products - Admin'],
      summary: 'Hard delete product (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      responses: {
        200: { description: 'Product deleted successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/products/count': {
    get: {
      tags: ['Products - Admin'],
      summary: 'Get product count (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Count retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { count: { type: 'integer', example: 42 } } } },
              },
            },
          },
        },
      },
    },
  },

  '/admin/products/featured/{count}': {
    get: {
      tags: ['Products - Admin'],
      summary: 'Get featured products (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'count', in: 'path', required: true, schema: { type: 'integer', minimum: 0, maximum: 100 }, example: 5 }],
      responses: {
        200: {
          description: 'Featured products retrieved successfully',
          content: {
            'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } },
          },
        },
      },
    },
  },
};

module.exports = productPaths;

