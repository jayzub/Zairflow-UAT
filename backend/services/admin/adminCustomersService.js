const customerRepository = require('../../repositories/admin/customerRepository');

async function listCustomersForStore(storeId) {
  return customerRepository.listForStore(storeId);
}

async function getCustomerDetails({ storeId, customerId }) {
  return customerRepository.findOneForStoreByIdWithUser(storeId, customerId);
}

async function createCustomer({ storeId, body }) {
  const { customerId, firstName, lastName, email, phone } = body || {};
  return customerRepository.create({
    customerId,
    firstName,
    lastName,
    email,
    phone,
    store: storeId,
  });
}

async function updateCustomer({ storeId, customerId, body }) {
  const customer = await customerRepository.findOneForStoreById(storeId, customerId);
  if (!customer) return { ok: false, reason: 'not_found' };

  const { firstName, lastName, email, phone } = body || {};
  const updated = await customerRepository.updateOneForStoreById(storeId, customerId, {
    firstName,
    lastName,
    email,
    phone,
  });

  return { ok: true, customer: updated };
}

async function deleteCustomer({ storeId, customerId }) {
  const customer = await customerRepository.findOneForStoreById(storeId, customerId);
  if (!customer) return { ok: false, reason: 'not_found' };

  await customerRepository.deleteOneForStoreById(storeId, customerId);
  return { ok: true };
}

module.exports = {
  listCustomersForStore,
  getCustomerDetails,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

