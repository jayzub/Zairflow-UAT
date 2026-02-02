const mongoose = require('mongoose');
const BaseProduct = require('../../models/products/baseProduct');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

async function aggregate(pipeline) {
  return BaseProduct.aggregate(pipeline);
}

async function count(filter = {}) {
  return BaseProduct.countDocuments(filter);
}

async function findById(id) {
  return BaseProduct.findById(toObjectId(id));
}

async function findOne(query) {
  return BaseProduct.findOne(query);
}

async function findOneLean(query, populate = []) {
  let q = BaseProduct.findOne(query);
  for (const p of populate) q = q.populate(p);
  return q.lean();
}

async function findOneAndUpdate(query, update, options) {
  return BaseProduct.findOneAndUpdate(query, update, options);
}

async function findByIdAndUpdate(id, update, options) {
  return BaseProduct.findByIdAndUpdate(toObjectId(id), update, options);
}

async function findOneAndDelete(query) {
  return BaseProduct.findOneAndDelete(query);
}

async function findByIdAndDelete(id) {
  return BaseProduct.findByIdAndDelete(toObjectId(id));
}

module.exports = {
  aggregate,
  count,
  findById,
  findOne,
  findOneLean,
  findOneAndUpdate,
  findByIdAndUpdate,
  findOneAndDelete,
  findByIdAndDelete,
};

