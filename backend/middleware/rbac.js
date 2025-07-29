const User = require('../models/user');
const { handleAuthError } = require('../utils/responseHandler');

/**
 * Role-based access control middleware
 * Defines what each role can and cannot do
 */

// Role hierarchy (higher = more permissions)
const ROLE_HIERARCHY = {
  'platform_admin': 3,
  'store_owner': 2,
  'store_admin': 1
};

// Permission definitions
const PERMISSIONS = {
  // Store Management
  'store:create': ['platform_admin', 'store_owner'],
  'store:read': ['platform_admin', 'store_owner', 'store_admin'],
  'store:update': ['platform_admin', 'store_owner'],
  'store:delete': ['platform_admin', 'store_owner'],
  'store:settings': ['platform_admin', 'store_owner'],
  
  // User Management
  'user:create_admin': ['platform_admin', 'store_owner'],
  'user:read': ['platform_admin', 'store_owner', 'store_admin'],
  'user:update': ['platform_admin', 'store_owner'],
  'user:delete': ['platform_admin', 'store_owner'],
  'user:change_password': ['platform_admin', 'store_owner', 'store_admin'],
  
  // Product Management
  'product:create': ['platform_admin', 'store_owner', 'store_admin'],
  'product:read': ['platform_admin', 'store_owner', 'store_admin'],
  'product:update': ['platform_admin', 'store_owner', 'store_admin'],
  'product:delete': ['platform_admin', 'store_owner', 'store_admin'],
  
  // Category Management
  'category:create': ['platform_admin', 'store_owner', 'store_admin'],
  'category:read': ['platform_admin', 'store_owner', 'store_admin'],
  'category:update': ['platform_admin', 'store_owner', 'store_admin'],
  'category:delete': ['platform_admin', 'store_owner', 'store_admin'],
  
  // Order Management
  'order:create': ['platform_admin', 'store_owner', 'store_admin'],
  'order:read': ['platform_admin', 'store_owner', 'store_admin'],
  'order:update': ['platform_admin', 'store_owner', 'store_admin'],
  'order:delete': ['platform_admin', 'store_owner'],
  
  // Customer Management
  'customer:create': ['platform_admin', 'store_owner', 'store_admin'],
  'customer:read': ['platform_admin', 'store_owner', 'store_admin'],
  'customer:update': ['platform_admin', 'store_owner', 'store_admin'],
  'customer:delete': ['platform_admin', 'store_owner'],
  
  // Analytics & Reports
  'analytics:read': ['platform_admin', 'store_owner', 'store_admin'],
  'reports:generate': ['platform_admin', 'store_owner', 'store_admin'],
  
  // Platform Management (Platform Admin Only)
  'platform:manage_users': ['platform_admin'],
  'platform:manage_stores': ['platform_admin'],
  'platform:system_settings': ['platform_admin'],
  'platform:view_all_data': ['platform_admin']
};

/**
 * Check if user has permission for a specific action
 */
const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    return false; // Permission not defined
  }
  return allowedRoles.includes(userRole);
};

/**
 * Check if user has minimum role level
 */
const hasMinimumRole = (userRole, minimumRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Middleware to require specific permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return handleAuthError(req, res, 'Authentication required', 401);
    }

    if (!hasPermission(req.user.role, permission)) {
      return handleAuthError(req, res, 'Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Middleware to require minimum role level
 */
const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return handleAuthError(req, res, 'Authentication required', 401);
    }

    if (!hasMinimumRole(req.user.role, minimumRole)) {
      return handleAuthError(req, res, 'Insufficient role level', 403);
    }

    next();
  };
};

/**
 * Middleware to restrict to specific roles only
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return handleAuthError(req, res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return handleAuthError(req, res, 'Access denied for this role', 403);
    }

    next();
  };
};

/**
 * Middleware to ensure user owns the store or is platform admin
 */
const requireStoreOwnership = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return handleAuthError(req, res, 'Authentication required', 401);
    }

    // Platform admins can access everything
    if (req.user.isPlatformAdmin) {
      return next();
    }

    // For store owners and admins, ensure they have access to the store
    if (!req.store) {
      return handleAuthError(req, res, 'Store context required', 400);
    }

    // Check if user owns the store or is an admin of the store
    const isOwner = req.store.owner.toString() === req.user._id.toString();
    const isAdmin = req.store.admins.some(adminId => adminId.toString() === req.user._id.toString());

    if (!isOwner && !isAdmin) {
      return handleAuthError(req, res, 'Access denied to this store', 403);
    }

    next();
  };
};

/**
 * Get user permissions for frontend
 */
const getUserPermissions = (userRole) => {
  const permissions = {};
  
  Object.keys(PERMISSIONS).forEach(permission => {
    permissions[permission] = hasPermission(userRole, permission);
  });
  
  return permissions;
};

module.exports = {
  PERMISSIONS,
  ROLE_HIERARCHY,
  hasPermission,
  hasMinimumRole,
  requirePermission,
  requireMinimumRole,
  requireRole,
  requireStoreOwnership,
  getUserPermissions
}; 