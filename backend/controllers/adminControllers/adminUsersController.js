const { asyncHandler } = require('../../middleware/asyncHandler');

const adminAuthService = require('../../services/admin/adminAuthService');
const adminUsersService = require('../../services/admin/adminUsersService');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');

// Admin: Render create admin page
exports.createAdminPage = asyncHandler(async (req, res) => {
  try {
    return respondWithViewOrJson(req, res, 'admin/create-admin', {
      pageTitle: 'Create Admin',
    });
  } catch (error) {
    console.error('Error loading create admin page:', error);
    res.status(500).render('admin/error', { error: 'Failed to load create admin page' });
  }
});

// Admin: Create a new admin user
exports.createAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, storeId } = req.body;
  const emailInput = (email || '').trim();

  // Check if user already exists
  const existingUser = await adminAuthService.findUserByEmail(emailInput);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  const user = await adminUsersService.createAdminUser({
    firstName,
    lastName,
    email: emailInput,
    password,
    role,
    storeId,
  });

  res.status(201).json({
    success: true,
    message: 'Admin user created successfully',
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });
});

// Admin: Get all users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await adminUsersService.listUsers({ storeId: req.store?._id });

  res.status(200).json({
    success: true,
    data: users,
  });
});

// Admin: Get user count
exports.getUserCount = asyncHandler(async (req, res) => {
  const userCount = await adminUsersService.countUsers({ storeId: req.store?._id });

  res.status(200).json({
    success: true,
    data: {
      userCount: userCount,
    },
  });
});

// Admin: Get user details
exports.getUserDetails = asyncHandler(async (req, res) => {
  const user = await adminUsersService.getUserDetails(req.params.id, { storeId: req.store?._id });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Admin: Update user
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await adminUsersService.updateUser({ id, body: req.body, storeId: req.store?._id });
  if (!result.ok && result.reason === 'not_found') {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: result.user,
  });
});

// Admin: Delete user
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await adminUsersService.deleteUser(id, { storeId: req.store?._id });
  if (!result.ok && result.reason === 'not_found') {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (!result.ok && result.reason === 'platform_admin') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete platform admin',
    });
  }

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Admin: Create store admin
exports.createStoreAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, position, department, storeId } = req.body;
  const emailInput = (email || '').trim();

  // Check if user already exists
  const existingUser = await adminAuthService.findUserByEmail(emailInput);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Create new store admin user
  const savedUser = await adminUsersService.createStoreAdminUser({
    firstName,
    lastName,
    email: emailInput,
    password,
    phone,
    position: position || 'Store Admin',
    department: department || 'Management',
    storeId,
    currentUser: req.user,
  });

  res.status(201).json({
    success: true,
    message: 'Store admin created successfully',
    data: {
      id: savedUser._id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      role: savedUser.role,
    },
  });
});

