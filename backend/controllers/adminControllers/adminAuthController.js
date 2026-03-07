const { asyncHandler } = require('../../middleware/asyncHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminAuthService = require('../../services/admin/adminAuthService');

exports.login = asyncHandler(async (req, res) => {
  const emailInput = (req.body.email || '').trim();
  const user = await adminAuthService.findUserForLoginByEmail(emailInput);
  const secret = process.env.JWT_SECRET || process.env.secret;

  // Check if user exists and password is correct
  if (!user || !bcrypt.compareSync(req.body.password, user.passwordHash)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
    },
    secret,
    { expiresIn: '1d' }
  );

  // Set JWT as HTTP-only cookie (canonical auth; do not send token in body to avoid XSS via localStorage)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  };
  res.cookie('token', token, cookieOptions);

  return res.status(200).json({
    success: true,
    user: user.email,
    role: user.role,
    isPlatformAdmin: user.isPlatformAdmin,
  });
});

exports.register = asyncHandler(async (req, res) => {
  // Check if user already exists
  const emailInput = (req.body.email || '').trim();
  const existingUser = await adminAuthService.findUserByEmail(emailInput);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  const savedUser = await adminAuthService.createRegisteredUser({
    name: req.body.name,
    email: emailInput,
    password: req.body.password,
    phone: req.body.phone,
    role: req.body.role,
    position: req.body.position,
    department: req.body.department,
    isAdmin: req.body.isAdmin,
  });

  if (!savedUser) {
    return res.status(500).json({
      success: false,
      message: 'User cannot be created',
    });
  }

  // Remove password hash from response
  const userResponse = savedUser.toObject();
  delete userResponse.passwordHash;

  res.status(201).json({
    success: true,
    data: userResponse,
    message: 'User registered successfully',
  });
});

/**
 * Log out admin: clear the HTTP-only token cookie. Client should clear any local state (e.g. adminUser) and redirect to sign-in.
 */
exports.logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, path: '/', sameSite: 'lax' });
  res.status(204).end();
};

