const bcrypt = require('bcryptjs');
const userRepository = require('../../repositories/admin/userRepository');

async function getCurrentUser(userId) {
  return userRepository.findCurrentUser(userId);
}

async function updateCurrentUser({ userId, existingPreferences, body }) {
  const { name, phone, position, department, preferences } = body || {};

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (position !== undefined) updateData.position = position;
  if (department !== undefined) updateData.department = department;
  if (preferences) updateData.preferences = { ...(existingPreferences || {}), ...preferences };

  return userRepository.updateCurrentUser(userId, updateData);
}

async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await userRepository.findForPasswordChange(userId);
  if (!user) return { ok: false, reason: 'not_found' };

  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return { ok: false, reason: 'current_password_incorrect' };
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  await user.save();
  return { ok: true };
}

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
};

