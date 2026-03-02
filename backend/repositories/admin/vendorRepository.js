const mongoose = require('mongoose');
const Vendor = require('../../models/vendor');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function findOneForStoreById(storeId, vendorId) {
  return Vendor.findOne({ _id: toObjectId(vendorId), store: toObjectId(storeId) });
}

async function findOneForStoreByEmail(storeId, email) {
  return Vendor.findOne({ store: toObjectId(storeId), email });
}

async function findOneForStoreByName(storeId, name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return Vendor.findOne({ store: toObjectId(storeId), name: trimmed });
}

async function findOneForStoreByEmailExcludingId(storeId, email, excludeId) {
  return Vendor.findOne({ store: toObjectId(storeId), email, _id: { $ne: toObjectId(excludeId) } });
}

async function listForStore(storeId) {
  return Vendor.find({ store: toObjectId(storeId) }).sort({ name: 1 });
}

async function listActiveForStore(storeId) {
  return Vendor.find({ store: toObjectId(storeId), isActive: true }).select('name _id').sort({ name: 1 });
}

async function create(doc) {
  const vendor = new Vendor(doc);
  return vendor.save();
}

async function updateOneForStoreById(storeId, vendorId, updateData) {
  return Vendor.findOneAndUpdate(
    { _id: toObjectId(vendorId), store: toObjectId(storeId) },
    updateData,
    { new: true, runValidators: true }
  );
}

async function deleteOneForStoreById(storeId, vendorId) {
  return Vendor.findOneAndDelete({ _id: toObjectId(vendorId), store: toObjectId(storeId) });
}

async function aggregateStatsForStore(storeId) {
  const sid = toObjectId(storeId);
  return Vendor.aggregate([
    { $match: { store: sid } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'vendor',
        as: 'products',
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        productCount: {
          $size: {
            $filter: {
              input: '$products',
              as: 'p',
              cond: { $eq: ['$$p.store', sid] },
            },
          },
        },
        isActive: 1,
        dateCreated: 1,
      },
    },
    { $sort: { name: 1 } },
  ]);
}

module.exports = {
  findOneForStoreById,
  findOneForStoreByEmail,
  findOneForStoreByName,
  findOneForStoreByEmailExcludingId,
  listForStore,
  listActiveForStore,
  create,
  updateOneForStoreById,
  deleteOneForStoreById,
  aggregateStatsForStore,
};

