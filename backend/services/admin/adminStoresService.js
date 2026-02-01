const storeRepository = require('../../repositories/admin/storeRepository');
const userRepository = require('../../repositories/admin/userRepository');

function generateSlug(storeName) {
  return String(storeName || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(name) {
  let slug = generateSlug(name);
  let originalSlug = slug;
  let counter = 1;

  while (await storeRepository.existsBySlug(slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function createStore({ userId, body }) {
  const { name, description, contactInfo, settings, theme, website } = body || {};

  const slug = await generateUniqueSlug(name);

  const store = await storeRepository.createStore({
    name,
    slug,
    description: description || '',
    owner: userId,
    contactInfo: contactInfo || {},
    settings: settings || {},
    theme: theme || {},
    website: website || '',
  });

  await userRepository.addOwnedStoreToUser(userId, store._id);

  return store;
}

async function getStoreDetails(storeId) {
  return storeRepository.findByIdWithOwnerAndAdmins(storeId);
}

async function updateStore({ storeId, body, currentUser }) {
  const { name, description, address, phone, email, website, contactInfo } = body || {};

  const store = await storeRepository.findById(storeId);
  if (!store) return { ok: false, reason: 'not_found' };

  // Preserve controller behavior: only owner or platform admin can update store
  if (!currentUser.isPlatformAdmin && String(store.owner) !== String(currentUser._id)) {
    return { ok: false, reason: 'forbidden' };
  }

  if (name !== undefined) store.name = name;
  if (description !== undefined) store.description = description;
  if (website !== undefined) store.website = website;

  store.contactInfo = store.contactInfo || {};
  store.contactInfo.address = store.contactInfo.address || {};

  if (contactInfo && typeof contactInfo === 'object') {
    store.contactInfo = { ...store.contactInfo, ...contactInfo };
    if (contactInfo.address && typeof contactInfo.address === 'object') {
      store.contactInfo.address = { ...store.contactInfo.address, ...contactInfo.address };
    }
  }

  if (email !== undefined) store.contactInfo.email = email;
  if (phone !== undefined) store.contactInfo.phone = phone;
  if (address !== undefined) {
    if (typeof address === 'string') {
      store.contactInfo.address.street = address;
    } else if (address && typeof address === 'object') {
      store.contactInfo.address = { ...store.contactInfo.address, ...address };
    }
  }

  const updatedStore = await store.save();
  return { ok: true, store: updatedStore };
}

async function deleteStore({ storeId, currentUser }) {
  const store = await storeRepository.findById(storeId);
  if (!store) return { ok: false, reason: 'not_found' };

  // Preserve controller behavior: only owner or platform admin can delete
  if (!currentUser.isPlatformAdmin && String(store.owner) !== String(currentUser._id)) {
    return { ok: false, reason: 'forbidden' };
  }

  await storeRepository.deleteById(storeId);
  await userRepository.removeOwnedStoreFromUser(currentUser._id, storeId);

  return { ok: true };
}

async function getStoreAnalytics(storeId) {
  return storeRepository.getStoreAnalytics(storeId);
}

async function addStoreAdmin({ storeId, email, currentUser }) {
  const store = await storeRepository.findById(storeId);
  if (!store) return { ok: false, reason: 'store_not_found' };

  // Preserve controller behavior
  if (String(store.owner) !== String(currentUser._id) && !currentUser.isPlatformAdmin) {
    return { ok: false, reason: 'forbidden' };
  }

  const user = await userRepository.findByEmail(email);
  if (!user) return { ok: false, reason: 'user_not_found' };

  await storeRepository.addAdminToStore(storeId, user._id);
  await userRepository.addAdminStoreToUser(user._id, storeId);

  return { ok: true };
}

async function removeStoreAdmin({ storeId, userId, currentUser }) {
  const store = await storeRepository.findById(storeId);
  if (!store) return { ok: false, reason: 'store_not_found' };

  // Preserve controller behavior
  if (String(store.owner) !== String(currentUser._id) && !currentUser.isPlatformAdmin) {
    return { ok: false, reason: 'forbidden' };
  }

  await storeRepository.removeAdminFromStore(storeId, userId);
  await userRepository.removeAdminStoreFromUser(userId, storeId);

  return { ok: true };
}

async function getStoreSettings(storeId) {
  const store = await storeRepository.findById(storeId);
  if (!store) return null;
  return {
    settings: store.settings,
    contactInfo: store.contactInfo,
  };
}

async function updateStoreSettings({ storeId, body, currentUser }) {
  const { settings, contactInfo } = body || {};

  const store = await storeRepository.findById(storeId);
  if (!store) return { ok: false, reason: 'not_found' };

  const isOwner = String(store.owner) === String(currentUser._id);
  const isAdmin = Array.isArray(store.admins) && store.admins.some((id) => String(id) === String(currentUser._id));

  if (!isOwner && !isAdmin && !currentUser.isPlatformAdmin) {
    return { ok: false, reason: 'forbidden' };
  }

  if (settings) store.settings = { ...store.settings, ...settings };
  if (contactInfo) store.contactInfo = { ...store.contactInfo, ...contactInfo };

  const updated = await store.save();
  return { ok: true, store: updated };
}

async function getStoreTheme(storeId) {
  const store = await storeRepository.findById(storeId);
  if (!store) return null;
  return { theme: store.theme };
}

async function updateStoreTheme({ storeId, body, currentUser }) {
  const { theme } = body || {};

  const store = await storeRepository.findById(storeId);
  if (!store) return { ok: false, reason: 'not_found' };

  const isOwner = String(store.owner) === String(currentUser._id);
  const isAdmin = Array.isArray(store.admins) && store.admins.some((id) => String(id) === String(currentUser._id));

  if (!isOwner && !isAdmin && !currentUser.isPlatformAdmin) {
    return { ok: false, reason: 'forbidden' };
  }

  if (theme) store.theme = { ...store.theme, ...theme };
  const updated = await store.save();
  return { ok: true, store: updated };
}

async function getUserStores({ userId, userRole, isPlatformAdmin }) {
  const platform = Boolean(isPlatformAdmin || userRole === 'platform_admin');
  return storeRepository.aggregateUserStores({ userId, isPlatformAdmin: platform });
}

module.exports = {
  createStore,
  getStoreDetails,
  updateStore,
  deleteStore,
  getStoreAnalytics,
  addStoreAdmin,
  removeStoreAdmin,
  getStoreSettings,
  updateStoreSettings,
  getStoreTheme,
  updateStoreTheme,
  getUserStores,
};

