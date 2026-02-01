const userRepository = require('../../repositories/admin/userRepository');
const storeRepository = require('../../repositories/admin/storeRepository');

async function listUsers({ storeId } = {}) {
  // Store-scoped when storeId is present; platform admins may operate without store context.
  if (storeId) return userRepository.listUsersForStore(storeId);
  return userRepository.listUsersGlobal();
}

async function countUsers({ storeId } = {}) {
  if (storeId) return userRepository.countUsersForStore(storeId);
  return userRepository.countUsersGlobal();
}

async function getUserDetails(userId, { storeId } = {}) {
  if (storeId) return userRepository.getUserDetailsForStore(userId, storeId);
  return userRepository.getUserDetailsById(userId);
}

async function updateUser({ id, body, storeId }) {
  const user = storeId
    ? await userRepository.findUserForUpdateInStore(id, storeId)
    : await userRepository.findUserById(id);
  if (!user) return { ok: false, reason: 'not_found' };

  const { firstName, lastName, email, role, isActive } = body || {};

  const updateData = {
    firstName,
    lastName,
    email,
    role,
    isActive,
  };

  // Keep legacy `name` consistent when first/last updated (findByIdAndUpdate won't run schema hooks).
  const nextFirstName = firstName !== undefined ? firstName : user.firstName;
  const nextLastName = lastName !== undefined ? lastName : user.lastName;
  const derivedName = `${nextFirstName || ''} ${nextLastName || ''}`.trim();
  if (derivedName) updateData.name = derivedName;

  const updatedUser = await userRepository.updateUserById(id, updateData);
  return { ok: true, user: updatedUser };
}

async function deleteUser(id, { storeId } = {}) {
  const user = storeId
    ? await userRepository.findUserForUpdateInStore(id, storeId)
    : await userRepository.findUserById(id);
  if (!user) return { ok: false, reason: 'not_found' };
  if (user.isPlatformAdmin) return { ok: false, reason: 'platform_admin' };

  await userRepository.deleteUserById(id);
  return { ok: true };
}

async function createAdminUser({ firstName, lastName, email, password, role, storeId }) {
  const emailInput = (email || '').trim();

  const savedUser = await userRepository.createUser({
    firstName,
    lastName,
    email: emailInput.toLowerCase(),
    password, // virtual -> passwordHash
    role: role || 'admin',
    isActive: true,
  });

  // If storeId is provided, add user as admin to that store
  if (storeId) {
    const store = await storeRepository.findById(storeId);
    if (store) {
      await storeRepository.addAdminToStore(storeId, savedUser._id);
      await userRepository.updateUserById(savedUser._id, { $addToSet: { adminStores: storeId } });
    }
  }

  return savedUser;
}

async function createStoreAdminUser({
  firstName,
  lastName,
  email,
  password,
  phone,
  position,
  department,
  storeId,
  currentUser,
}) {
  const emailInput = (email || '').trim();

  const savedUser = await userRepository.createUser({
    firstName,
    lastName,
    email: emailInput.toLowerCase(),
    password, // virtual -> passwordHash
    phone,
    role: 'store_admin',
    position: position || 'Store Admin',
    department: department || 'Management',
    isAdmin: false,
    isActive: true,
    isVerified: false,
  });

  // If storeId is provided, add the user as admin to that store
  // Behavior preserved: if store not found / no access, we still return 201 success (no linking).
  if (storeId) {
    const store = await storeRepository.findById(storeId);
    if (store) {
      if (store.owner.toString() === currentUser._id.toString() || currentUser.isPlatformAdmin) {
        await storeRepository.addAdminToStore(storeId, savedUser._id);
        await userRepository.updateUserById(savedUser._id, { $addToSet: { adminStores: store._id } });
      }
    }
  }

  return savedUser;
}

module.exports = {
  listUsers,
  countUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  createAdminUser,
  createStoreAdminUser,
};

