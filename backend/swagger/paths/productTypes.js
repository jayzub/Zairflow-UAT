/**
 * Product Types configuration endpoints documentation (Admin)
 */

const productTypesPaths = {
  '/admin/product-types/config': {
    get: {
      tags: ['Product Types - Admin'],
      summary: 'Get product types config (includes custom types)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Product types configuration retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
};

module.exports = productTypesPaths;

