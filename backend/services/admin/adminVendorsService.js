const mongoose = require('mongoose');
const vendorRepository = require('../../repositories/admin/vendorRepository');
const productRepository = require('../../repositories/admin/productRepository');

function validateEmailOrNull(raw) {
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw === null) return { ok: true, value: null };

  const email = String(raw).trim();
  if (!email) return { ok: true, value: null };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { ok: false, message: 'Invalid email format' };

  return { ok: true, value: email };
}

async function listVendorsForStore(storeId) {
  return vendorRepository.listForStore(storeId);
}

async function getVendorForEdit({ storeId, vendorId }) {
  return vendorRepository.findOneForStoreById(storeId, vendorId);
}

async function createVendor({ storeId, body }) {
  const { name, description, email, phone, address, isActive } = body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return {
      ok: false,
      status: 400,
      payload: { success: false, message: 'Vendor name is required and must be a non-empty string' },
    };
  }

  const parsedEmail = validateEmailOrNull(email);
  if (!parsedEmail.ok) {
    return { ok: false, status: 400, payload: { success: false, message: parsedEmail.message } };
  }

  if (parsedEmail.value) {
    const existingVendor = await vendorRepository.findOneForStoreByEmail(storeId, parsedEmail.value);
    if (existingVendor) {
      return {
        ok: false,
        status: 400,
        payload: { success: false, message: 'A vendor with this email already exists in your store' },
      };
    }
  }

  try {
    const vendor = await vendorRepository.create({
      name: name.trim(),
      description: description || '',
      email: parsedEmail.value,
      phone: phone || '',
      address: address || '',
      isActive: isActive !== 'false' && isActive !== false,
      store: storeId,
    });

    return {
      ok: true,
      status: 201,
      payload: { success: true, message: 'Vendor created successfully', data: vendor },
    };
  } catch (error) {
    if (error?.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return {
          ok: false,
          status: 400,
          payload: { success: false, message: 'A vendor with this email already exists in your store' },
        };
      }
      return {
        ok: false,
        status: 400,
        payload: { success: false, message: 'A vendor with these details already exists in your store' },
      };
    }

    return {
      ok: false,
      status: 500,
      payload: { success: false, message: 'Error creating vendor', error: error?.message },
    };
  }
}

async function updateVendor({ storeId, vendorId, body }) {
  const { name, description, email, phone, address, isActive } = body || {};

  if (!mongoose.isValidObjectId(vendorId)) {
    return { ok: false, status: 400, payload: { success: false, message: 'Invalid vendor ID' } };
  }

  const vendor = await vendorRepository.findOneForStoreById(storeId, vendorId);
  if (!vendor) return { ok: false, status: 404, payload: { success: false, message: 'Vendor not found' } };

  const parsedEmail = validateEmailOrNull(email);
  if (!parsedEmail.ok) {
    return { ok: false, status: 400, payload: { success: false, message: parsedEmail.message } };
  }

  if (parsedEmail.value && parsedEmail.value !== vendor.email) {
    const existingVendor = await vendorRepository.findOneForStoreByEmailExcludingId(storeId, parsedEmail.value, vendorId);
    if (existingVendor) {
      return {
        ok: false,
        status: 400,
        payload: { success: false, message: 'A vendor with this email already exists in your store' },
      };
    }
  }

  const updateData = {
    name: name || vendor.name,
    description: description !== undefined ? description : vendor.description,
    email: email !== undefined ? parsedEmail.value : vendor.email,
    phone: phone !== undefined ? phone : vendor.phone,
    address: address !== undefined ? address : vendor.address,
    isActive: isActive !== undefined ? isActive !== 'false' && isActive !== false : vendor.isActive,
  };

  try {
    const updatedVendor = await vendorRepository.updateOneForStoreById(storeId, vendorId, updateData);
    return {
      ok: true,
      status: 200,
      payload: { success: true, message: 'Vendor updated successfully', data: updatedVendor },
    };
  } catch (error) {
    if (error?.code === 11000) {
      return {
        ok: false,
        status: 400,
        payload: { success: false, message: 'A vendor with this email already exists in your store' },
      };
    }
    return {
      ok: false,
      status: 500,
      payload: { success: false, message: 'Error updating vendor', error: error?.message },
    };
  }
}

async function deleteVendor({ storeId, vendorId }) {
  if (!mongoose.isValidObjectId(vendorId)) {
    return { ok: false, status: 400, payload: { success: false, message: 'Invalid vendor ID' } };
  }

  const vendor = await vendorRepository.findOneForStoreById(storeId, vendorId);
  if (!vendor) return { ok: false, status: 404, payload: { success: false, message: 'Vendor not found' } };

  // Store-scoped product count to avoid cross-store blockage
  const productCount = await productRepository.count({ vendor: vendorId, store: storeId });
  if (productCount > 0) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: `Cannot delete vendor. There are ${productCount} product(s) associated with this vendor. Please reassign or remove products first.`,
      },
    };
  }

  await vendorRepository.deleteOneForStoreById(storeId, vendorId);
  return { ok: true, status: 200, payload: { success: true, message: 'Vendor deleted successfully' } };
}

async function getVendorStats(storeId) {
  return vendorRepository.aggregateStatsForStore(storeId);
}

module.exports = {
  listVendorsForStore,
  getVendorForEdit,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorStats,
};

