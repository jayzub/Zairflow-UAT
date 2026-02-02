const mongoose = require('mongoose');
const Order = require('../../models/order');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function listForStoreWithPopulates(storeId) {
  return Order.find({ store: toObjectId(storeId) })
    .populate('customer', 'firstName lastName email')
    .populate('products.product', 'name price image')
    .sort({ createdAt: -1 });
}

async function findOneForStoreByIdWithDetails(storeId, orderId) {
  return Order.findOne({ _id: toObjectId(orderId), store: toObjectId(storeId) })
    .populate('customer', 'firstName lastName email phone address')
    .populate('products.product', 'name price image description');
}

async function findOneForStoreById(storeId, orderId) {
  return Order.findOne({ _id: toObjectId(orderId), store: toObjectId(storeId) });
}

async function updateOneForStoreById(storeId, orderId, update) {
  return Order.findOneAndUpdate(
    { _id: toObjectId(orderId), store: toObjectId(storeId) },
    update,
    { new: true, runValidators: true }
  );
}

module.exports = {
  listForStoreWithPopulates,
  findOneForStoreByIdWithDetails,
  findOneForStoreById,
  updateOneForStoreById,
};

