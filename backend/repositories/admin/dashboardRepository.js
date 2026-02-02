const mongoose = require('mongoose');
const BaseProduct = require('../../models/products/baseProduct');
const Category = require('../../models/category');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function countProducts(filter) {
  return BaseProduct.countDocuments(filter);
}

async function countCategories(filter) {
  return Category.countDocuments(filter);
}

async function getDashboardCounts({ isPlatformAdmin, storeId }) {
  const productFilter = { isActive: true };
  const categoryFilter = {};

  if (!isPlatformAdmin && storeId) {
    const sid = toObjectId(storeId);
    productFilter.store = sid;
    categoryFilter.store = sid;
  }

  const [totalProducts, featuredProducts, lowStockProducts, totalCategories] = await Promise.all([
    countProducts(productFilter),
    countProducts({ ...productFilter, isFeatured: true }),
    countProducts({ ...productFilter, countInStock: { $lt: 10 } }),
    countCategories(categoryFilter),
  ]);

  return { totalProducts, featuredProducts, lowStockProducts, totalCategories };
}

module.exports = {
  getDashboardCounts,
};

