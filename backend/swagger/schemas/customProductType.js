/**
 * Custom Product Type Swagger schemas
 */

const customProductTypeSchemas = {
  CustomProductTypeConfig: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'MyCustomType' },
      displayName: { type: 'string', example: 'My Custom Type' },
      description: { type: 'string', example: 'Custom product type description' },
      icon: { type: 'string', example: 'fas fa-box' },
      color: { type: 'string', example: '#6c757d' },
      fields: { type: 'object', additionalProperties: true },
      variantFields: { type: 'array', items: { type: 'string' } },
      subscriptionPlans: { type: 'array', items: { type: 'string' }, example: ['custom'] },
      isCustom: { type: 'boolean', example: true },
      store: { type: 'string', example: '507f1f77bcf86cd799439011' },
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      id: { type: 'string', example: '507f1f77bcf86cd799439011' },
    },
  },

  CustomProductTypeCreate: {
    type: 'object',
    required: ['name', 'displayName'],
    properties: {
      name: { type: 'string', example: 'MyCustomType' },
      displayName: { type: 'string', example: 'My Custom Type' },
      description: { type: 'string' },
      icon: { type: 'string' },
      color: { type: 'string' },
      fields: { type: 'object', additionalProperties: true },
      variantFields: { type: 'array', items: { type: 'string' } },
      isActive: { type: 'boolean', example: true },
    },
  },

  CustomProductTypeUpdate: {
    type: 'object',
    properties: {
      displayName: { type: 'string' },
      description: { type: 'string' },
      icon: { type: 'string' },
      color: { type: 'string' },
      fields: { type: 'object', additionalProperties: true },
      variantFields: { type: 'array', items: { type: 'string' } },
      isActive: { type: 'boolean' },
    },
  },
};

module.exports = customProductTypeSchemas;

