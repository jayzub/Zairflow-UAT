const { asyncHandler } = require('../../middleware/asyncHandler');

const adminMeService = require('../../services/admin/adminMeService');

exports.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await adminMeService.getCurrentUser(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

exports.updateCurrentUser = asyncHandler(async (req, res) => {
  const user = await adminMeService.updateCurrentUser({
    userId: req.user._id,
    existingPreferences: req.user.preferences,
    body: req.body,
  });

  res.json({
    success: true,
    data: user,
    message: 'Profile updated successfully',
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
    });
  }

  const result = await adminMeService.changePassword({
    userId: req.user._id,
    currentPassword,
    newPassword,
  });

  if (!result.ok && result.reason === 'not_found') {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (!result.ok && result.reason === 'current_password_incorrect') {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

