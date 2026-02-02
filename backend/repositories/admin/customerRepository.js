const mongoose = require('mongoose');
const Customer = require('../../models/customer');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function listForStore(storeId) {
  return Customer.find({ store: toObjectId(storeId) })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });
}

async function findOneForStoreById(storeId, customerId) {
  return Customer.findOne({ _id: toObjectId(customerId), store: toObjectId(storeId) });
}

async function findOneForStoreByIdWithUser(storeId, customerId) {
  return Customer.findOne({ _id: toObjectId(customerId), store: toObjectId(storeId) }).populate(
    'user',
    'firstName lastName email phone'
  );
}

async function create(doc) {
  const customer = new Customer(doc);
  return customer.save();
}

async function updateOneForStoreById(storeId, customerId, update) {
  return Customer.findOneAndUpdate(
    { _id: toObjectId(customerId), store: toObjectId(storeId) },
    update,
    { new: true, runValidators: true }
  );
}

async function deleteOneForStoreById(storeId, customerId) {
  return Customer.findOneAndDelete({ _id: toObjectId(customerId), store: toObjectId(storeId) });
}

module.exports = {
  listForStore,
  findOneForStoreById,
  findOneForStoreByIdWithUser,
  create,
  updateOneForStoreById,
  deleteOneForStoreById,
};

