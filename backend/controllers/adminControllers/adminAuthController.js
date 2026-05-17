const { asyncHandler } = require('../../middleware/asyncHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../../models/user');
const adminAuthService = require('../../services/admin/adminAuthService');
const { sendAdminPasswordResetEmail } = require('../../services/adminPasswordResetEmail');
const { isAdminRegistrationEnabled } = require('../../config/adminRegistration');

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
  if (!isAdminRegistrationEnabled()) {
    return res.status(403).json({
      success: false,
      message: 'Admin registration is closed. Contact contact@zairflow.com to request access.',
    });
  }

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

/** Token expiry for password reset (1 hour). */
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

function hashResetToken(plainToken) {
  return crypto.createHash('sha256').update(plainToken).digest('hex');
}

/**
 * POST /admin/forgot-password
 * Body: { email }
 * If the email belongs to an admin user, generates a reset token, saves it, and sends the reset link by email.
 * Always returns 200 with a generic message to avoid user enumeration.
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await User.findOne({ email }).select('_id email firstName lastName name').lean();
  if (user) {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashResetToken(plainToken);
    const expires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires
    });
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || '';
    sendAdminPasswordResetEmail(user.email, plainToken, name).catch((err) => {
      console.error('[adminAuth] Forgot password email failed:', err.message);
    });
  }

  return res.status(200).json({
    success: true,
    message: 'If an account exists with that email, you will receive a password reset link shortly. Please check your inbox and spam folder.'
  });
});

/**
 * POST /admin/reset-password
 * Body: { token, newPassword }
 * Validates the token, then sets the new password and clears the reset token.
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const plainToken = (token || '').trim();
  const password = (newPassword || '').trim();

  if (!plainToken) {
    return res.status(400).json({ success: false, message: 'Reset token is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const hashedToken = hashResetToken(plainToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  }).select('+passwordHash');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset link. Please request a new password reset.'
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Password has been reset. You can now sign in with your new password.'
  });
});

