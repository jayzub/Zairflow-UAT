/**
 * Customer Swagger schemas (basic)
 */

const customerSchemas = {
  Customer: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      store: { type: 'string', example: '507f1f77bcf86cd799439011' },
      firstName: { type: 'string', example: 'Jane' },
      lastName: { type: 'string', example: 'Doe' },
      email: { type: 'string', example: 'jane@example.com' },
      phone: { type: 'string', example: '+15551234567' },
      address: { type: 'object', additionalProperties: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
};

module.exports = customerSchemas;

