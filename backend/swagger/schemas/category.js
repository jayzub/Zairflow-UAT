/**
 * Category API schemas for Swagger documentation
 */

const categorySchemas = {
  CategoryAttribute: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Size',
        description: 'Attribute name'
      },
      type: {
        type: 'string',
        enum: ['string', 'number', 'boolean', 'date', 'object', 'array'],
        example: 'string',
        description: 'Attribute data type'
      },
      required: {
        type: 'boolean',
        example: false,
        description: 'Whether this attribute is required for products in this category'
      },
      unit: {
        type: 'string',
        example: 'cm',
        description: 'Unit for numerical values (e.g., kg, cm, etc.)'
      },
      options: {
        type: 'array',
        items: {
          type: 'string'
        },
        example: ['Small', 'Medium', 'Large'],
        description: 'Predefined values/choices for this attribute'
      }
    },
    required: ['name', 'type']
  },

  Category: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '507f1f77bcf86cd799439011',
        description: 'Category unique identifier'
      },
      store: {
        type: 'string',
        example: '507f1f77bcf86cd799439012',
        description: 'Store ID that owns this category'
      },
      name: {
        type: 'string',
        example: 'Laptops',
        description: 'Category name'
      },
      slug: {
        type: 'string',
        example: 'laptops',
        description: 'URL-friendly category identifier'
      },
      description: {
        type: 'string',
        example: 'Computer laptops and notebooks',
        description: 'Category description'
      },
      icon: {
        type: 'string',
        example: 'fas fa-laptop',
        description: 'Icon class for category display'
      },
      color: {
        type: 'string',
        example: '#007bff',
        description: 'Category color for UI display'
      },
      image: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            example: 'https://example.com/category-image.jpg'
          },
          public_id: {
            type: 'string',
            example: 'category_images/laptops'
          }
        }
      },
      parent: {
        type: 'string',
        example: '507f1f77bcf86cd799439013',
        description: 'Parent category ID for hierarchical structure'
      },
      allowedProductTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['Electronics', 'Clothing', 'Furniture', 'Books']
        },
        example: ['Electronics'],
        description: 'Product types allowed in this category'
      },
      attributes: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CategoryAttribute'
        },
        description: 'Category-specific attributes for products'
      },
      displayOrder: {
        type: 'integer',
        example: 1,
        description: 'Display order for sorting categories'
      },
      isActive: {
        type: 'boolean',
        example: true,
        description: 'Whether the category is active'
      },
      productCount: {
        type: 'integer',
        example: 25,
        description: 'Number of products in this category'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2023-01-15T10:30:00.000Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2023-01-15T10:30:00.000Z'
      }
    },
    required: ['name', 'slug', 'store', 'allowedProductTypes']
  },

  CategoryTree: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '507f1f77bcf86cd799439011'
      },
      name: {
        type: 'string',
        example: 'Electronics'
      },
      slug: {
        type: 'string',
        example: 'electronics'
      },
      isActive: {
        type: 'boolean',
        example: true
      },
      children: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CategoryTree'
        },
        description: 'Child categories'
      }
    }
  },

  CategoryCreate: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Laptops',
        description: 'Category name'
      },
      slug: {
        type: 'string',
        example: 'laptops',
        description: 'URL-friendly category identifier'
      },
      description: {
        type: 'string',
        example: 'Computer laptops and notebooks',
        description: 'Category description'
      },
      icon: {
        type: 'string',
        example: 'fas fa-laptop',
        description: 'Icon class for category display'
      },
      color: {
        type: 'string',
        example: '#007bff',
        description: 'Category color for UI display'
      },
      parent: {
        type: 'string',
        example: '507f1f77bcf86cd799439013',
        description: 'Parent category ID (optional)'
      },
      allowedProductTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['Electronics', 'Clothing', 'Furniture', 'Books']
        },
        example: ['Electronics'],
        description: 'Product types allowed in this category'
      },
      attributes: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CategoryAttribute'
        },
        description: 'Category-specific attributes'
      },
      displayOrder: {
        type: 'integer',
        example: 1,
        description: 'Display order for sorting'
      },
      isActive: {
        type: 'boolean',
        example: true,
        description: 'Whether the category is active'
      }
    },
    required: ['name', 'slug', 'allowedProductTypes']
  },

  CategoryUpdate: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Laptops & Notebooks',
        description: 'Category name'
      },
      slug: {
        type: 'string',
        example: 'laptops-notebooks',
        description: 'URL-friendly category identifier'
      },
      description: {
        type: 'string',
        example: 'Computer laptops and notebooks for professionals',
        description: 'Category description'
      },
      icon: {
        type: 'string',
        example: 'fas fa-laptop',
        description: 'Icon class for category display'
      },
      color: {
        type: 'string',
        example: '#28a745',
        description: 'Category color for UI display'
      },
      parent: {
        type: 'string',
        example: '507f1f77bcf86cd799439013',
        description: 'Parent category ID (optional)'
      },
      allowedProductTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['Electronics', 'Clothing', 'Furniture', 'Books']
        },
        example: ['Electronics'],
        description: 'Product types allowed in this category'
      },
      attributes: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CategoryAttribute'
        },
        description: 'Category-specific attributes'
      },
      displayOrder: {
        type: 'integer',
        example: 2,
        description: 'Display order for sorting'
      },
      isActive: {
        type: 'boolean',
        example: true,
        description: 'Whether the category is active'
      }
    }
  },

  CategoryStats: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '507f1f77bcf86cd799439011'
      },
      name: {
        type: 'string',
        example: 'Laptops'
      },
      slug: {
        type: 'string',
        example: 'laptops'
      },
      productCount: {
        type: 'integer',
        example: 25,
        description: 'Number of products in this category'
      },
      isActive: {
        type: 'boolean',
        example: true
      },
      displayOrder: {
        type: 'integer',
        example: 1
      }
    }
  },

  CategoryProductsResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        properties: {
          category: {
            $ref: '#/components/schemas/Category'
          },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439014'
                },
                name: {
                  type: 'string',
                  example: 'MacBook Pro'
                },
                price: {
                  type: 'number',
                  example: 1299.99
                },
                images: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      url: { type: 'string' },
                      public_id: { type: 'string' }
                    }
                  }
                }
              }
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                example: 1
              },
              limit: {
                type: 'integer',
                example: 20
              },
              total: {
                type: 'integer',
                example: 100
              },
              pages: {
                type: 'integer',
                example: 5
              }
            }
          }
        }
      }
    }
  },

  CategoryListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Category'
        }
      }
    }
  },

  CategoryTreeResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CategoryTree'
        }
      }
    }
  },

  CategoryStatsResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CategoryStats'
        }
      }
    }
  }
};

module.exports = categorySchemas; 