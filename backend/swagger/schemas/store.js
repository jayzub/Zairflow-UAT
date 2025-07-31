/**
 * Store-related Swagger schemas
 */

const storeSchemas = {
  Store: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '507f1f77bcf86cd799439011'
      },
      name: {
        type: 'string',
        example: 'My Awesome Store',
        minLength: 1,
        maxLength: 100
      },
      slug: {
        type: 'string',
        example: 'my-awesome-store',
        pattern: '^[a-z0-9-]+$'
      },
      description: {
        type: 'string',
        example: 'A great store for awesome products',
        maxLength: 500
      },
      logo: {
        type: 'object',
        properties: {
          url: { 
            type: 'string',
            format: 'uri',
            example: 'https://example.com/logo.png'
          },
          public_id: { 
            type: 'string',
            example: 'stores/logos/logo_123'
          }
        }
      },
      banner: {
        type: 'object',
        properties: {
          url: { 
            type: 'string',
            format: 'uri',
            example: 'https://example.com/banner.png'
          },
          public_id: { 
            type: 'string',
            example: 'stores/banners/banner_123'
          }
        }
      },
      owner: {
        $ref: '#/components/schemas/User'
      },
      admins: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/User'
        }
      },
      contactInfo: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            example: 'contact@store.com'
          },
          phone: { 
            type: 'string',
            example: '+1-555-123-4567'
          },
          address: {
            type: 'object',
            properties: {
              street: { 
                type: 'string',
                example: '123 Main St'
              },
              city: { 
                type: 'string',
                example: 'New York'
              },
              state: { 
                type: 'string',
                example: 'NY'
              },
              zipCode: { 
                type: 'string',
                example: '10001'
              },
              country: { 
                type: 'string',
                example: 'US',
                default: 'US'
              }
            }
          }
        }
      },
      settings: {
        type: 'object',
        properties: {
          currency: { 
            type: 'string', 
            example: 'USD',
            default: 'USD'
          },
          timezone: { 
            type: 'string', 
            example: 'UTC',
            default: 'UTC'
          },
          language: { 
            type: 'string', 
            example: 'en',
            default: 'en'
          },
          taxRate: { 
            type: 'number', 
            example: 0,
            minimum: 0,
            maximum: 100,
            default: 0
          },
          shippingEnabled: { 
            type: 'boolean', 
            example: true,
            default: true
          },
          reviewsEnabled: { 
            type: 'boolean', 
            example: true,
            default: true
          },
          socialLoginEnabled: { 
            type: 'boolean', 
            example: false,
            default: false
          }
        }
      },
      theme: {
        type: 'object',
        properties: {
          primaryColor: { 
            type: 'string', 
            example: '#007bff',
            pattern: '^#[0-9A-Fa-f]{6}$',
            default: '#007bff'
          },
          secondaryColor: { 
            type: 'string', 
            example: '#6c757d',
            pattern: '^#[0-9A-Fa-f]{6}$',
            default: '#6c757d'
          },
          fontFamily: { 
            type: 'string', 
            example: 'Arial, sans-serif',
            default: 'Arial, sans-serif'
          }
        }
      },
      isActive: {
        type: 'boolean',
        example: true,
        default: true
      },
      isVerified: {
        type: 'boolean',
        example: false,
        default: false
      },
      subscription: {
        type: 'object',
        properties: {
          plan: { 
            type: 'string', 
            example: 'free',
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: 'free'
          },
          startDate: { 
            type: 'string', 
            format: 'date-time'
          },
          endDate: { 
            type: 'string', 
            format: 'date-time'
          },
          features: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['advanced_analytics', 'custom_domain', 'priority_support', 'unlimited_products']
            }
          }
        }
      },
      analytics: {
        type: 'object',
        properties: {
          totalSales: { 
            type: 'number', 
            example: 0,
            minimum: 0
          },
          totalOrders: { 
            type: 'number', 
            example: 0,
            minimum: 0
          },
          totalProducts: { 
            type: 'number', 
            example: 0,
            minimum: 0
          },
          totalCustomers: { 
            type: 'number', 
            example: 0,
            minimum: 0
          }
        }
      },
      dateCreated: {
        type: 'string',
        format: 'date-time'
      },
      lastUpdated: {
        type: 'string',
        format: 'date-time'
      }
    },
    required: ['name', 'slug', 'owner', 'contactInfo']
  },

  StoreCreateRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        example: 'My Awesome Store',
        minLength: 1,
        maxLength: 100
      },
      description: {
        type: 'string',
        example: 'A great store for awesome products',
        maxLength: 500
      },
      contactInfo: {
        type: 'object',
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            example: 'contact@store.com'
          },
          phone: { 
            type: 'string',
            example: '+1-555-123-4567'
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string' }
            }
          }
        }
      },
      settings: {
        type: 'object',
        properties: {
          currency: { type: 'string', example: 'USD' },
          timezone: { type: 'string', example: 'UTC' },
          language: { type: 'string', example: 'en' },
          taxRate: { type: 'number', example: 0 },
          shippingEnabled: { type: 'boolean', example: true },
          reviewsEnabled: { type: 'boolean', example: true },
          socialLoginEnabled: { type: 'boolean', example: false }
        }
      },
      theme: {
        type: 'object',
        properties: {
          primaryColor: { type: 'string', example: '#007bff' },
          secondaryColor: { type: 'string', example: '#6c757d' },
          fontFamily: { type: 'string', example: 'Arial, sans-serif' }
        }
      }
    }
  },

  StoreUpdateRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'My Updated Store',
        minLength: 1,
        maxLength: 100
      },
      description: {
        type: 'string',
        example: 'Updated store description',
        maxLength: 500
      },
      contactInfo: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string' }
            }
          }
        }
      },
      settings: {
        type: 'object',
        properties: {
          currency: { type: 'string' },
          timezone: { type: 'string' },
          language: { type: 'string' },
          taxRate: { type: 'number' },
          shippingEnabled: { type: 'boolean' },
          reviewsEnabled: { type: 'boolean' },
          socialLoginEnabled: { type: 'boolean' }
        }
      },
      theme: {
        type: 'object',
        properties: {
          primaryColor: { type: 'string' },
          secondaryColor: { type: 'string' },
          fontFamily: { type: 'string' }
        }
      }
    }
  },

  StoreAnalytics: {
    type: 'object',
    properties: {
      productCount: {
        type: 'number',
        example: 50,
        description: 'Total number of active products'
      },
      orderCount: {
        type: 'number',
        example: 150,
        description: 'Total number of orders'
      },
      categoryCount: {
        type: 'number',
        example: 10,
        description: 'Total number of active categories'
      },
      monthlyRevenue: {
        type: 'number',
        example: 15000,
        description: 'Revenue for the last 30 days'
      },
      recentOrders: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Order'
        },
        description: 'Recent orders (last 10)'
      },
      topProducts: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Product'
        },
        description: 'Top 5 products by rating'
      }
    }
  },

  StoreDiscoveryResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Store'
        }
      },
      pagination: {
        $ref: '#/components/schemas/Pagination'
      }
    }
  },

  StoreAdminRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'admin@example.com',
        description: 'Email of user to add as admin'
      }
    }
  },

  StoreAdminRemoveRequest: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {
        type: 'string',
        example: '507f1f77bcf86cd799439011',
        description: 'ID of user to remove as admin'
      }
    }
  }
};

module.exports = storeSchemas; 