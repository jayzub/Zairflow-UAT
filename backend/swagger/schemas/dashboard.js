/**
 * Dashboard Swagger schemas
 */

const dashboardSchemas = {
  DashboardStatsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          totalProducts: { type: 'integer', example: 120 },
          featuredProducts: { type: 'integer', example: 8 },
          lowStockProducts: { type: 'integer', example: 3 },
          totalCategories: { type: 'integer', example: 14 },
        },
      },
    },
  },
};

module.exports = dashboardSchemas;

