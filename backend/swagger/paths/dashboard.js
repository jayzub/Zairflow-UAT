/**
 * Admin dashboard endpoints documentation
 */

const dashboardPaths = {
  '/admin/dashboard/stats': {
    get: {
      tags: ['Dashboard - Admin'],
      summary: 'Get dashboard stats',
      description: 'Returns aggregate counts for products and categories scoped to the current store (platform admins see all).',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Dashboard stats retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DashboardStatsResponse',
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

module.exports = dashboardPaths;

