const mongoose = require('mongoose');
const Store = require('../../models/store');
const Product = require('../../models/products/baseProduct');
const Category = require('../../models/category');
const Order = require('../../models/order');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function existsBySlug(slug) {
  return Store.exists({ slug });
}

async function findById(storeId) {
  return Store.findById(storeId);
}

async function findByIdWithOwnerAndAdmins(storeId) {
  return Store.findById(storeId)
    .populate('owner', 'firstName lastName email')
    .populate('admins', 'firstName lastName email');
}

async function createStore(doc) {
  const store = new Store(doc);
  return store.save();
}

async function deleteById(storeId) {
  return Store.findByIdAndDelete(toObjectId(storeId));
}

async function addAdminToStore(storeId, userId) {
  const sid = toObjectId(storeId);
  const uid = toObjectId(userId);
  return Store.findByIdAndUpdate(sid, { $addToSet: { admins: uid } }, { new: true });
}

async function removeAdminFromStore(storeId, userId) {
  const sid = toObjectId(storeId);
  const uid = toObjectId(userId);
  return Store.findByIdAndUpdate(sid, { $pull: { admins: uid } }, { new: true });
}

async function aggregateUserStores({ userId, isPlatformAdmin }) {
  const uid = toObjectId(userId);

  const base = [];
  if (!isPlatformAdmin) {
    base.push({
      $match: {
        $or: [{ owner: uid }, { admins: uid }],
      },
    });
  }

  return Store.aggregate([
    ...base,
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    { $unwind: '$owner' },
    {
      $lookup: {
        from: 'users',
        localField: 'admins',
        foreignField: '_id',
        as: 'admins',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        slug: 1,
        isActive: 1,
        isVerified: 1,
        dateCreated: 1,
        'owner._id': 1,
        'owner.firstName': 1,
        'owner.lastName': 1,
        'owner.email': 1,
        'admins._id': 1,
        'admins.firstName': 1,
        'admins.lastName': 1,
        'admins.email': 1,
        subscription: 1,
      },
    },
  ]);
}

async function getStoreAnalytics(storeId) {
  const sid = String(storeId);

  const productCount = await Product.countDocuments({ store: sid, isActive: true });
  const orderCount = await Order.countDocuments({ store: sid });
  const categoryCount = await Category.countDocuments({ store: sid, isActive: true });

  const recentOrders = await Order.find({ store: sid })
    .sort({ dateOrdered: -1 })
    .limit(10)
    .populate('customer', 'name email');

  const topProducts = await Product.find({ store: sid, isActive: true })
    .sort({ rating: -1, numReviews: -1 })
    .limit(5);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrdersRevenue = await Order.aggregate([
    { $match: { store: sid, dateOrdered: { $gte: thirtyDaysAgo } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);

  const monthlyRevenue = recentOrdersRevenue[0]?.total || 0;

  return {
    productCount,
    orderCount,
    categoryCount,
    monthlyRevenue,
    recentOrders,
    topProducts,
  };
}

module.exports = {
  existsBySlug,
  findById,
  findByIdWithOwnerAndAdmins,
  createStore,
  deleteById,
  addAdminToStore,
  removeAdminFromStore,
  aggregateUserStores,
  getStoreAnalytics,
};

