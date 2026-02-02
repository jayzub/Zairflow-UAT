const mongoose = require('mongoose');
const Customer = require('../../models/customer');
const CustomerStoreMembership = require('../../models/customerStoreMembership');

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function upsertMembership({ customerId, storeId }) {
  if (!customerId || !storeId) return null;
  return CustomerStoreMembership.findOneAndUpdate(
    { customer: toObjectId(customerId), store: toObjectId(storeId) },
    {
      $setOnInsert: {
        customer: toObjectId(customerId),
        store: toObjectId(storeId),
        joinedAt: new Date(),
        status: 'active',
      },
    },
    { upsert: true, new: true }
  );
}

async function listForStore(storeId) {
  const memberships = await CustomerStoreMembership.find({
    store: toObjectId(storeId),
    status: 'active',
  })
    .populate('customer')
    .sort({ createdAt: -1 });

  // Return customer documents (global), filtered to this store via memberships
  return memberships.map((m) => m.customer).filter(Boolean);
}

async function findOneForStoreById(storeId, customerId) {
  const membership = await CustomerStoreMembership.findOne({
    store: toObjectId(storeId),
    customer: toObjectId(customerId),
    status: 'active',
  }).populate('customer');
  return membership?.customer || null;
}

async function findOneForStoreByIdWithUser(storeId, customerId) {
  // No separate "user" relation on Customer; return the populated customer (if membership exists)
  const membership = await CustomerStoreMembership.findOne({
    store: toObjectId(storeId),
    customer: toObjectId(customerId),
    status: 'active',
  }).populate('customer');
  return membership?.customer || null;
}

async function create(doc) {
  const storeId = doc?.store;
  if (!storeId) throw new Error('store is required');

  // Admin creates a store membership for an existing global customer (by customerId or email)
  let customer = null;

  if (doc?.customerId) {
    customer = await Customer.findById(toObjectId(doc.customerId));
  } else if (doc?.email) {
    const emailInput = String(doc.email || '').trim();
    customer = await Customer.findOne({
      email: new RegExp(`^${escapeRegex(emailInput)}$`, 'i'),
    });
  }

  if (!customer) {
    throw new Error('Customer not found. Create the customer via customer registration first.');
  }

  // Optionally update basic fields (mapped from legacy admin form fields)
  const firstName = doc?.firstName ? String(doc.firstName).trim() : '';
  const lastName = doc?.lastName ? String(doc.lastName).trim() : '';
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (name) customer.name = name;
  if (doc?.phone) customer.phone = doc.phone;
  if (doc?.email) customer.email = String(doc.email).trim().toLowerCase();
  await customer.save();

  await upsertMembership({ customerId: customer._id, storeId });

  return customer;
}

async function updateOneForStoreById(storeId, customerId, update) {
  const membership = await CustomerStoreMembership.findOne({
    store: toObjectId(storeId),
    customer: toObjectId(customerId),
    status: 'active',
  });
  if (!membership) return null;

  const customer = await Customer.findById(toObjectId(customerId));
  if (!customer) return null;

  const firstName = update?.firstName ? String(update.firstName).trim() : '';
  const lastName = update?.lastName ? String(update.lastName).trim() : '';
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (name) customer.name = name;
  if (update?.phone) customer.phone = update.phone;
  if (update?.email) customer.email = String(update.email).trim().toLowerCase();

  await customer.save();
  return customer;
}

async function deleteOneForStoreById(storeId, customerId) {
  // Remove membership from this store (do not delete the global customer account)
  return CustomerStoreMembership.findOneAndDelete({
    store: toObjectId(storeId),
    customer: toObjectId(customerId),
  });
}

module.exports = {
  listForStore,
  findOneForStoreById,
  findOneForStoreByIdWithUser,
  create,
  updateOneForStoreById,
  deleteOneForStoreById,
};

