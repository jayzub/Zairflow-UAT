/**
 * Order API endpoints documentation (Admin)
 */

const orderPaths = {
  '/admin/orders': {
    get: {
      tags: ['Orders - Admin'],
      summary: 'List orders (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Orders page / data rendered' },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/orders/{id}': {
    get: {
      tags: ['Orders - Admin'],
      summary: 'Get order details (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      responses: {
        200: { description: 'Order details page rendered' },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/orders/{id}/status': {
    put: {
      tags: ['Orders - Admin'],
      summary: 'Update order status (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: { status: { type: 'string', example: 'shipped' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Order status updated successfully' },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/admin/orders/{id}/refund': {
    post: {
      tags: ['Orders - Admin'],
      summary: 'Process refund (Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refundAmount'],
              properties: {
                refundAmount: { type: 'number', example: 10.0 },
                reason: { type: 'string', example: 'Customer request' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Refund processed successfully' },
        400: { description: 'Validation error / exceeds total', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
};

module.exports = orderPaths;

