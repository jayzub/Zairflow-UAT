/**
 * Vendor Swagger schemas
 */

const vendorSchemas = {
  Vendor: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      store: { type: 'string', example: '507f1f77bcf86cd799439011' },
      name: { type: 'string', example: 'Acme Supplies' },
      description: { type: 'string', example: 'Preferred supplier' },
      email: { type: 'string', nullable: true, example: 'vendor@acme.com' },
      phone: { type: 'string', example: '+15551234567' },
      address: { type: 'string', example: '123 Main St' },
      isActive: { type: 'boolean', example: true },
      dateCreated: { type: 'string', format: 'date-time' },
    },
  },
};

module.exports = vendorSchemas;

