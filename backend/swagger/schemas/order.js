/**
 * Order Swagger schemas (basic)
 */

const orderSchemas = {
  Order: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      store: { type: 'string', example: '507f1f77bcf86cd799439011' },
      status: { type: 'string', example: 'paid' },
      totalAmount: { type: 'number', example: 129.99 },
      refundAmount: { type: 'number', nullable: true, example: 10.0 },
      refundReason: { type: 'string', nullable: true },
      refundDate: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
};

module.exports = orderSchemas;

