/**
 * Common Swagger schemas used across the API
 */

const commonSchemas = {
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        example: 'Operation completed successfully'
      }
    }
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      message: {
        type: 'string',
        example: 'An error occurred'
      },
      error: {
        type: 'string',
        example: 'Detailed error message'
      },
      code: {
        type: 'string',
        example: 'VALIDATION_ERROR'
      },
      details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  },

  PaginatedResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'array',
        items: {
          type: 'object'
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
            example: 10
          },
          total: {
            type: 'integer',
            example: 100
          },
          pages: {
            type: 'integer',
            example: 10
          },
          hasNext: {
            type: 'boolean',
            example: true
          },
          hasPrev: {
            type: 'boolean',
            example: false
          }
        }
      }
    }
  },

  ValidationError: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      message: {
        type: 'string',
        example: 'Validation failed'
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              example: 'email'
            },
            message: {
              type: 'string',
              example: 'Email is required'
            },
            value: {
              type: 'string',
              example: ''
            }
          }
        }
      }
    }
  },

  UnauthorizedError: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      message: {
        type: 'string',
        example: 'Unauthorized access'
      },
      code: {
        type: 'string',
        example: 'UNAUTHORIZED'
      }
    }
  },

  ForbiddenError: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      message: {
        type: 'string',
        example: 'Access forbidden'
      },
      code: {
        type: 'string',
        example: 'FORBIDDEN'
      }
    }
  },

  NotFoundError: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      message: {
        type: 'string',
        example: 'Resource not found'
      },
      code: {
        type: 'string',
        example: 'NOT_FOUND'
      }
    }
  },

  ConflictError: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      message: {
        type: 'string',
        example: 'Resource already exists'
      },
      code: {
        type: 'string',
        example: 'CONFLICT'
      }
    }
  },

  ServerError: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      message: {
        type: 'string',
        example: 'Internal server error'
      },
      code: {
        type: 'string',
        example: 'INTERNAL_ERROR'
      }
    }
  }
};

module.exports = commonSchemas; 