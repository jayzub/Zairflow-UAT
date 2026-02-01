const mongoose = require('mongoose');
const Store = require('../../models/store');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function findById(storeId) {
  return Store.findById(storeId);
}

async function addAdminToStore(storeId, userId) {
  const sid = toObjectId(storeId);
  const uid = toObjectId(userId);
  return Store.findByIdAndUpdate(sid, { $addToSet: { admins: uid } }, { new: true });
}

module.exports = {
  findById,
  addAdminToStore,
};

