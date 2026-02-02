/**
 * Customer API endpoints documentation (Admin)
 */

const customerPaths = {
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
};

module.exports = customerPaths;

