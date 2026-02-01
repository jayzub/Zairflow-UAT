const mongoose = require('mongoose');
const User = require('../../models/user');

function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function emailRegexExactCaseInsensitive(emailInput) {
  const email = (emailInput || '').trim();
  return new RegExp(`^${escapeRegex(email)}$`, 'i');
}

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function findByEmail(emailInput) {
  return User.findOne({ email: emailRegexExactCaseInsensitive(emailInput) });
}

async function findForLoginByEmail(emailInput) {
  return User.findOne({ email: emailRegexExactCaseInsensitive(emailInput) }).select('+passwordHash');
}

async function createUser(doc) {
  const user = new User(doc);
  return user.save();
}

async function findCurrentUser(userId) {
  return User.findById(userId)
    .select('-passwordHash')
    .populate('ownedStores', 'name slug')
    .populate('adminStores', 'name slug');
}

async function updateCurrentUser(userId, updateData) {
  return User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-passwordHash');
}

async function findForPasswordChange(userId) {
  return User.findById(userId).select('+passwordHash');
}

function storeScopedUserQuery(storeId) {
  const sid = toObjectId(storeId);
  return {
    $or: [{ ownedStores: sid }, { adminStores: sid }],
  };
}

async function listUsersForStore(storeId) {
  return User.find(storeScopedUserQuery(storeId))
    .select('-passwordHash')
    .populate('ownedStores', 'name')
    .populate('adminStores', 'name')
    .sort({ createdAt: -1 });
}

async function countUsersForStore(storeId) {
  return User.countDocuments(storeScopedUserQuery(storeId));
}

async function listUsersGlobal() {
  return User.find()
    .select('-passwordHash')
    .populate('ownedStores', 'name')
    .populate('adminStores', 'name')
    .sort({ createdAt: -1 });
}

async function countUsersGlobal() {
  return User.countDocuments();
}

async function getUserDetailsById(userId) {
  return User.findById(toObjectId(userId))
    .select('-passwordHash')
    .populate('ownedStores', 'name description')
    .populate('adminStores', 'name description');
}

async function findUserById(userId) {
  return User.findById(toObjectId(userId));
}

async function getUserDetailsForStore(userId, storeId) {
  const sid = toObjectId(storeId);
  return User.findOne({ _id: toObjectId(userId), ...storeScopedUserQuery(sid) })
    .select('-passwordHash')
    .populate('ownedStores', 'name description')
    .populate('adminStores', 'name description');
}

async function findUserForUpdateInStore(userId, storeId) {
  return User.findOne({ _id: toObjectId(userId), ...storeScopedUserQuery(storeId) });
}

async function updateUserById(userId, updateData) {
  return User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-passwordHash');
}

async function deleteUserById(userId) {
  return User.findByIdAndDelete(userId);
}

module.exports = {
  findByEmail,
  findForLoginByEmail,
  createUser,
  findCurrentUser,
  updateCurrentUser,
  findForPasswordChange,
  listUsersForStore,
  countUsersForStore,
  listUsersGlobal,
  countUsersGlobal,
  getUserDetailsForStore,
  getUserDetailsById,
  findUserForUpdateInStore,
  findUserById,
  updateUserById,
  deleteUserById,
};

