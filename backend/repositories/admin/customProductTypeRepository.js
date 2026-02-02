const mongoose = require('mongoose');
const CustomProductType = require('../../models/customProductType');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function listActiveForStore(storeId) {
  return CustomProductType.find({ store: toObjectId(storeId), isActive: true }).sort({ displayName: 1 });
}

async function findActiveByNameForStore(name, storeId) {
  return CustomProductType.findOne({ name, store: toObjectId(storeId), isActive: true });
}

async function findOneForStoreById(id, storeId) {
  return CustomProductType.findOne({ _id: toObjectId(id), store: toObjectId(storeId) });
}

async function create(doc) {
  const customType = new CustomProductType(doc);
  return customType.save();
}

async function save(doc) {
  return doc.save();
}

module.exports = {
  listActiveForStore,
  findActiveByNameForStore,
  findOneForStoreById,
  create,
  save,
};

