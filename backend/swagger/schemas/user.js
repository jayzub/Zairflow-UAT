/**
 * User-related Swagger schemas
 */

const userSchemas = {
  User: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '507f1f77bcf86cd799439011'
      },
      name: {
        type: 'string',
        example: 'John Doe'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john@example.com'
      },
      phone: {
        type: 'string',
        example: '+1234567890'
      },
      avatar: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          public_id: { type: 'string' }
        }
      },
      role: {
        type: 'string',
        enum: ['store_owner', 'store_admin', 'platform_admin'],
        example: 'store_owner'
      },
      ownedStores: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' }
          }
        }
      },
      adminStores: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' }
          }
        }
      },
      isPlatformAdmin: {
        type: 'boolean',
        example: false
      },
      position: {
        type: 'string',
        example: 'Store Manager'
      },
      department: {
        type: 'string',
        example: 'Sales'
      },
      permissions: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'manage_products',
            'manage_orders',
            'manage_customers',
            'manage_categories',
            'manage_store_settings',
            'view_analytics',
            'manage_admins',
            'manage_subscriptions',
            'platform_management'
          ]
        }
      },
      isActive: {
        type: 'boolean',
        example: true
      },
      isVerified: {
        type: 'boolean',
        example: false
      },
      lastLogin: {
        type: 'string',
        format: 'date-time'
      },
      preferences: {
        type: 'object',
        properties: {
          language: { type: 'string', example: 'en' },
          timezone: { type: 'string', example: 'UTC' },
          theme: { type: 'string', example: 'light' },
          notifications: {
            type: 'object',
            properties: {
              email: { type: 'boolean', example: true },
              push: { type: 'boolean', example: true },
              sms: { type: 'boolean', example: false }
            }
          }
        }
      },
      createdAt: {
        type: 'string',
        format: 'date-time'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time'
      }
    }
  },

  UserLogin: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'admin@example.com'
      },
      password: {
        type: 'string',
        example: 'password123'
      }
    }
  },

  UserRegister: {
    type: 'object',
    required: ['name', 'email', 'password', 'phone'],
    properties: {
      name: {
        type: 'string',
        example: 'John Doe'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john@example.com'
      },
      password: {
        type: 'string',
        minLength: 6,
        example: 'password123'
      },
      phone: {
        type: 'string',
        example: '+1234567890'
      },
      isAdmin: {
        type: 'boolean',
        example: false
      },
      role: {
        type: 'string',
        enum: ['store_owner', 'store_admin', 'platform_admin'],
        example: 'store_owner'
      },
      position: {
        type: 'string',
        example: 'Store Manager'
      },
      department: {
        type: 'string',
        example: 'Sales'
      }
    }
  },

  UserUpdate: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'John Doe'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john@example.com'
      },
      phone: {
        type: 'string',
        example: '+1234567890'
      },
      role: {
        type: 'string',
        enum: ['store_owner', 'store_admin', 'platform_admin']
      },
      position: {
        type: 'string',
        example: 'Store Manager'
      },
      department: {
        type: 'string',
        example: 'Sales'
      },
      isAdmin: {
        type: 'boolean'
      },
      isActive: {
        type: 'boolean'
      }
    }
  },

  UserProfileUpdate: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'John Doe'
      },
      phone: {
        type: 'string',
        example: '+1234567890'
      },
      position: {
        type: 'string',
        example: 'Store Manager'
      },
      department: {
        type: 'string',
        example: 'Sales'
      },
      preferences: {
        type: 'object',
        properties: {
          language: { type: 'string', example: 'en' },
          timezone: { type: 'string', example: 'UTC' },
          theme: { type: 'string', example: 'light' },
          notifications: {
            type: 'object',
            properties: {
              email: { type: 'boolean', example: true },
              push: { type: 'boolean', example: true },
              sms: { type: 'boolean', example: false }
            }
          }
        }
      }
    }
  },

  ChangePassword: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        example: 'oldpassword123'
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        example: 'newpassword123'
      }
    }
  },

  CreateStoreAdmin: {
    type: 'object',
    required: ['name', 'email', 'password', 'phone'],
    properties: {
      name: {
        type: 'string',
        example: 'Jane Smith'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'jane@store.com'
      },
      password: {
        type: 'string',
        minLength: 6,
        example: 'password123'
      },
      phone: {
        type: 'string',
        example: '+1234567890'
      },
      position: {
        type: 'string',
        example: 'Store Manager'
      },
      department: {
        type: 'string',
        example: 'Sales'
      },
      storeId: {
        type: 'string',
        description: 'Store ID to assign the admin to',
        example: '507f1f77bcf86cd799439011'
      }
    }
  }
};

module.exports = userSchemas; 