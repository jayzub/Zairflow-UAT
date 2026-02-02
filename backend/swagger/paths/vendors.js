/**
 * Vendor API endpoints documentation (Admin)
 */

const vendorPaths = {
  '/admin/vendors': {
    get: {
      tags: ['Vendors - Admin'],
      summary: 'List vendors (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Vendors retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Vendor' } },
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
      tags: ['Vendors - Admin'],
      summary: 'Create vendor (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Vendor created successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/vendors/{id}': {
    put: {
      tags: ['Vendors - Admin'],
      summary: 'Update vendor (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: {
        200: { description: 'Vendor updated successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    delete: {
      tags: ['Vendors - Admin'],
      summary: 'Delete vendor (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      responses: {
        200: { description: 'Vendor deleted successfully' },
        400: { description: 'Cannot delete vendor', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/vendors/stats': {
    get: {
      tags: ['Vendors - Admin'],
      summary: 'Get vendor statistics (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Vendor statistics retrieved successfully' },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
};

module.exports = vendorPaths;

