/**
 * Category API endpoints documentation
 */

const categoryPaths = {
  // Public routes (for store frontend - customers can access)
  '/categories/store/{storeSlug}': {
    get: {
      tags: ['Categories'],
      summary: 'Get all categories for a store',
      description: 'Retrieve all categories for a specific store. This endpoint is public and used by customers browsing the store.',
      parameters: [
        {
          name: 'storeSlug',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          example: 'apple-store',
          description: 'Store slug identifier'
        },
        {
          name: 'productType',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['Electronics', 'Clothing', 'Furniture', 'Books']
          },
          example: 'Electronics',
          description: 'Filter categories by allowed product type'
        },
        {
          name: 'isActive',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          },
          example: true,
          description: 'Filter by active status (defaults to true for public routes)'
        }
      ],
      responses: {
        200: {
          description: 'Categories retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CategoryListResponse'
              }
            }
          }
        },
        404: {
          description: 'Store not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },

  '/categories/store/{storeSlug}/tree': {
    get: {
      tags: ['Categories'],
      summary: 'Get category tree',
      description: 'Retrieve categories in hierarchical tree structure for navigation menus.',
      parameters: [
        {
          name: 'storeSlug',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          example: 'apple-store',
          description: 'Store slug identifier'
        },
        {
          name: 'productType',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['Electronics', 'Clothing', 'Furniture', 'Books']
          },
          example: 'Electronics',
          description: 'Filter categories by allowed product type'
        }
      ],
      responses: {
        200: {
          description: 'Category tree retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CategoryTreeResponse'
              }
            }
          }
        },
        404: {
          description: 'Store not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },

  '/categories/store/{storeSlug}/{categoryId}': {
    get: {
      tags: ['Categories'],
      summary: 'Get category by ID',
      description: 'Retrieve a specific category with its details and product count.',
      parameters: [
        {
          name: 'storeSlug',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          example: 'apple-store',
          description: 'Store slug identifier'
        },
        {
          name: 'categoryId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439011',
          description: 'Category ID'
        }
      ],
      responses: {
        200: {
          description: 'Category retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    $ref: '#/components/schemas/Category'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid category ID',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          description: 'Category or store not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },

  '/categories/store/{storeSlug}/{categoryId}/products': {
    get: {
      tags: ['Categories'],
      summary: 'Get products by category',
      description: 'Retrieve products belonging to a specific category with pagination.',
      parameters: [
        {
          name: 'storeSlug',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          example: 'apple-store',
          description: 'Store slug identifier'
        },
        {
          name: 'categoryId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439011',
          description: 'Category ID'
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1
          },
          example: 1,
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100
          },
          example: 20,
          description: 'Number of products per page'
        },
        {
          name: 'sort',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['dateCreated', 'name', 'price', 'rating']
          },
          example: 'dateCreated',
          description: 'Sort field'
        },
        {
          name: 'order',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['asc', 'desc']
          },
          example: 'desc',
          description: 'Sort order'
        }
      ],
      responses: {
        200: {
          description: 'Products retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CategoryProductsResponse'
              }
            }
          }
        },
        400: {
          description: 'Invalid category ID or parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          description: 'Category or store not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },

  // Admin routes (require authentication and store access)
  '/categories/admin': {
    get: {
      tags: ['Categories - Admin'],
      summary: 'Get all categories (Admin)',
      description: 'Retrieve all categories for the authenticated store with additional admin data.',
      security: [
        {
          bearerAuth: []
        },
        {
          cookieAuth: []
        }
      ],
      parameters: [
        {
          name: 'productType',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['Electronics', 'Clothing', 'Furniture', 'Books']
          },
          example: 'Electronics',
          description: 'Filter categories by allowed product type'
        },
        {
          name: 'isActive',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          },
          example: true,
          description: 'Filter by active status'
        }
      ],
      responses: {
        200: {
          description: 'Categories retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CategoryListResponse'
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Store access required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Categories - Admin'],
      summary: 'Create new category',
      description: 'Create a new category for the authenticated store.',
      security: [
        {
          bearerAuth: []
        },
        {
          cookieAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CategoryCreate'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Category created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    $ref: '#/components/schemas/Category'
                  },
                  message: {
                    type: 'string',
                    example: 'Category created successfully'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Admin access required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },

  '/categories/admin/{id}': {
    get: {
      tags: ['Categories - Admin'],
      summary: 'Get category by ID (Admin)',
      description: 'Retrieve a specific category with full admin details.',
      security: [
        {
          bearerAuth: []
        },
        {
          cookieAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439011',
          description: 'Category ID'
        }
      ],
      responses: {
        200: {
          description: 'Category retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    $ref: '#/components/schemas/Category'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid category ID',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Store access required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          description: 'Category not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Categories - Admin'],
      summary: 'Update category',
      description: 'Update an existing category.',
      security: [
        {
          bearerAuth: []
        },
        {
          cookieAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439011',
          description: 'Category ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CategoryUpdate'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Category updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    $ref: '#/components/schemas/Category'
                  },
                  message: {
                    type: 'string',
                    example: 'Category updated successfully'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Admin access required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          description: 'Category not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Categories - Admin'],
      summary: 'Delete category',
      description: 'Delete a category. Cannot delete if it has child categories or products.',
      security: [
        {
          bearerAuth: []
        },
        {
          cookieAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          example: '507f1f77bcf86cd799439011',
          description: 'Category ID'
        }
      ],
      responses: {
        200: {
          description: 'Category deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Category deleted successfully'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - Cannot delete category with children or products',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Admin access required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          description: 'Category not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },

  '/categories/admin/stats': {
    get: {
      tags: ['Categories - Admin'],
      summary: 'Get category statistics',
      description: 'Retrieve category statistics with product counts for analytics.',
      security: [
        {
          bearerAuth: []
        },
        {
          cookieAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Category statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CategoryStatsResponse'
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Store access required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  }
};

module.exports = categoryPaths; 