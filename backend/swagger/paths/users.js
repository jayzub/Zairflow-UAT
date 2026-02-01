/**
 * User API endpoints documentation
 */

const userPaths = {
  // NOTE: Admin routes are mounted at `/admin/*` in the app.
  '/admin/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Admin user login',
      description: 'Authenticate an admin user and return JWT token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserLogin'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  user: {
                    type: 'string',
                    example: 'admin@example.com'
                  },
                  token: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid credentials',
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

  '/admin/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new admin user',
      description: 'Create a new admin user account',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserRegister'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'User registered successfully',
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
                    $ref: '#/components/schemas/User'
                  },
                  message: {
                    type: 'string',
                    example: 'User registered successfully'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        409: {
          description: 'Email already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ConflictError'
              }
            }
          }
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServerError'
              }
            }
          }
        }
      }
    }
  },



  '/admin/me': {
    get: {
      tags: ['Users'],
      summary: 'Get current user profile',
      description: 'Retrieve the profile of the authenticated user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current user profile retrieved successfully',
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
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        },
        404: {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotFoundError'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Users'],
      summary: 'Update current user profile',
      description: 'Update the profile of the authenticated user',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserProfileUpdate'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
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
                    $ref: '#/components/schemas/User'
                  },
                  message: {
                    type: 'string',
                    example: 'Profile updated successfully'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        }
      }
    }
  },

  '/admin/users': {
    get: {
      tags: ['Users'],
      summary: 'Get all users (Admin only)',
      description: 'Retrieve a list of users for the current store context (platform admins may see all)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of users',
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
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/User'
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServerError'
              }
            }
          }
        }
      }
    }
  },

  '/admin/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get user by ID (Admin only)',
      description: 'Retrieve a specific user by their ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'User ID'
        }
      ],
      responses: {
        200: {
          description: 'User details',
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
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        },
        404: {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotFoundError'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Users'],
      summary: 'Update user (Admin only)',
      description: 'Update a specific user by their ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'User ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserUpdate'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'User updated successfully',
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
                    $ref: '#/components/schemas/User'
                  },
                  message: {
                    type: 'string',
                    example: 'User updated successfully'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        },
        404: {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotFoundError'
              }
            }
          }
        },
        409: {
          description: 'Email already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ConflictError'
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete user (Admin only)',
      description: 'Delete a specific user by their ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'User ID'
        }
      ],
      responses: {
        200: {
          description: 'User deleted successfully',
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
                    example: 'User deleted successfully'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        },
        404: {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotFoundError'
              }
            }
          }
        }
      }
    }
  },

  '/admin/users/count': {
    get: {
      tags: ['Users'],
      summary: 'Get total user count (Admin only)',
      description: 'Get the total number of users for the current store context (platform admins may see all)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User count',
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
                    type: 'object',
                    properties: {
                      userCount: {
                        type: 'number',
                        example: 150
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        }
      }
    }
  },

  '/admin/change-password': {
    post: {
      tags: ['Users'],
      summary: 'Change user password',
      description: 'Change the password of the authenticated user',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ChangePassword'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Password changed successfully',
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
                    example: 'Password changed successfully'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Current password and new password are required'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        },
        404: {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotFoundError'
              }
            }
          }
        }
      }
    }
  },

  '/admin/create-store-admin': {
    post: {
      tags: ['Users'],
      summary: 'Create a new store admin (Store Owner only)',
      description: 'Create a new store admin user with limited permissions',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateStoreAdmin'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Store admin created successfully',
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
                    $ref: '#/components/schemas/User'
                  },
                  message: {
                    type: 'string',
                    example: 'Store admin created successfully'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Only store owners and platform admins can create store admins',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ForbiddenError'
              }
            }
          }
        },
        409: {
          description: 'Email already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ConflictError'
              }
            }
          }
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServerError'
              }
            }
          }
        }
      }
    }
  }
};

module.exports = userPaths; 