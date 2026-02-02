const mongoose = require('mongoose');
const Category = require('../../models/category');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function findAllForStoreWithTree(storeId) {
  return Category.find({ store: toObjectId(storeId) })
    .populate('parent', 'name')
    .populate('children', 'name')
    .sort({ displayOrder: 1, name: 1 });
}

async function findForStoreParentSelection(storeId) {
  return Category.find({ store: toObjectId(storeId) }).select('name _id').sort({ name: 1 });
}

async function findOneForStoreById(storeId, categoryId) {
  return Category.findOne({ _id: toObjectId(categoryId), store: toObjectId(storeId) });
}

async function existsForStoreBySlug(storeId, slug) {
  return Category.exists({ store: toObjectId(storeId), slug });
}

async function findOneForStoreByName(storeId, name) {
  return Category.findOne({ store: toObjectId(storeId), name });
}

async function create(doc) {
  const category = new Category(doc);
  return category.save();
}

async function updateOneForStoreById(storeId, categoryId, updateData) {
  return Category.findOneAndUpdate(
    { _id: toObjectId(categoryId), store: toObjectId(storeId) },
    updateData,
    { new: true, runValidators: true }
  );
}

async function existsChildrenForStore(storeId, parentId) {
  return Category.exists({ parent: toObjectId(parentId), store: toObjectId(storeId) });
}

async function deleteOneForStoreById(storeId, categoryId) {
  return Category.findOneAndDelete({ _id: toObjectId(categoryId), store: toObjectId(storeId) });
}

async function aggregateStatsForStore(storeId) {
  const sid = toObjectId(storeId);
  return Category.aggregate([
    { $match: { store: sid } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'category',
        as: 'products',
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
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
        displayOrder: 1,
      },
    },
    { $sort: { displayOrder: 1, name: 1 } },
  ]);
}

module.exports = {
  findAllForStoreWithTree,
  findForStoreParentSelection,
  findOneForStoreById,
  existsForStoreBySlug,
  findOneForStoreByName,
  create,
  updateOneForStoreById,
  existsChildrenForStore,
  deleteOneForStoreById,
  aggregateStatsForStore,
};

