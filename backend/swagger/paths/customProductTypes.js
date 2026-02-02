/**
 * Custom Product Types API endpoints documentation (Admin)
 */

const customProductTypePaths = {
  '/admin/custom-product-types/api': {
    get: {
      tags: ['Product Types - Admin'],
      summary: 'List custom product types',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Custom product types retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/CustomProductTypeConfig' } },
                },
              },
            },
          },
        },
      },
    },
  },

  '/admin/custom-product-types/{id}': {
    get: {
      tags: ['Product Types - Admin'],
      summary: 'Get custom product type',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      responses: {
        200: { description: 'Custom product type retrieved successfully' },
        400: { description: 'Invalid ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    post: {
      tags: ['Product Types - Admin'],
      summary: 'Create custom product type',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CustomProductTypeCreate' },
          },
        },
      },
      responses: {
        201: { description: 'Created successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    put: {
      tags: ['Product Types - Admin'],
      summary: 'Update custom product type',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomProductTypeUpdate' } } },
      },
      responses: {
        200: { description: 'Updated successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    delete: {
      tags: ['Product Types - Admin'],
      summary: 'Delete (deactivate) custom product type',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      responses: {
        200: { description: 'Deleted successfully' },
        400: { description: 'Cannot delete or invalid ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
};

module.exports = customProductTypePaths;

