const mongoose = require('mongoose');

const customProductTypeRepository = require('../../repositories/admin/customProductTypeRepository');
const productRepository = require('../../repositories/admin/productRepository');

function normalizeFieldsMap(fields) {
  // Controller currently accepts object -> Map conversion
  const fieldsMap = new Map();
  if (fields && typeof fields === 'object') {
    Object.entries(fields).forEach(([key, value]) => fieldsMap.set(key, value));
  }
  return fieldsMap;
}

function decorateWithIds(doc) {
  return {
    ...doc.toProductTypeConfig(),
    _id: doc._id.toString(),
    id: doc._id.toString(),
  };
}

async function listCustomProductTypes({ storeId }) {
  if (!storeId) {
    return { ok: false, status: 400, payload: { success: false, message: 'Store ID is required' } };
  }

  const customTypes = await customProductTypeRepository.listActiveForStore(storeId);
  return {
    ok: true,
    status: 200,
    payload: { success: true, data: customTypes.map(decorateWithIds) },
  };
}

async function getCustomProductType({ storeId, id }) {
  if (!storeId) {
    return { ok: false, status: 400, payload: { success: false, message: 'Store ID is required' } };
  }

  if (!mongoose.isValidObjectId(id)) {
    return { ok: false, status: 400, payload: { success: false, message: 'Invalid custom product type ID' } };
  }

  const customType = await customProductTypeRepository.findOneForStoreById(id, storeId);
  if (!customType) {
    return { ok: false, status: 404, payload: { success: false, message: 'Custom product type not found' } };
  }

  return {
    ok: true,
    status: 200,
    payload: { success: true, data: decorateWithIds(customType) },
  };
}

async function createCustomProductType({ storeId, body, userId }) {
  if (!storeId) {
    return { ok: false, status: 400, payload: { success: false, message: 'Store ID is required' } };
  }

  if (!body?.name || !body?.displayName) {
    return {
      ok: false,
      status: 400,
      payload: { success: false, message: 'Name and display name are required' },
    };
  }

  const existing = await customProductTypeRepository.findActiveByNameForStore(body.name, storeId);
  if (existing) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: `A custom product type with name "${body.name}" already exists for this store`,
      },
    };
  }

  if (body.fields && typeof body.fields !== 'object') {
    return { ok: false, status: 400, payload: { success: false, message: 'Fields must be an object' } };
  }

  const fieldsMap = normalizeFieldsMap(body.fields);

  try {
    const savedType = await customProductTypeRepository.create({
      store: storeId,
      name: body.name,
      displayName: body.displayName,
      description: body.description || '',
      icon: body.icon || 'fas fa-box',
      color: body.color || '#6c757d',
      fields: fieldsMap,
      variantFields: body.variantFields || [],
      createdBy: userId,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return {
      ok: true,
      status: 201,
      payload: {
        success: true,
        data: savedType.toProductTypeConfig(),
        message: 'Custom product type created successfully',
      },
    };
  } catch (error) {
    if (error?.code === 11000) {
      return {
        ok: false,
        status: 400,
        payload: { success: false, message: 'A custom product type with this name already exists for this store' },
      };
    }

    return {
      ok: false,
      status: 500,
      payload: {
        success: false,
        message: 'Error creating custom product type',
        error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error',
      },
    };
  }
}

async function updateCustomProductType({ storeId, id, body }) {
  if (!storeId) {
    return { ok: false, status: 400, payload: { success: false, message: 'Store ID is required' } };
  }

  if (!mongoose.isValidObjectId(id)) {
    return { ok: false, status: 400, payload: { success: false, message: 'Invalid custom product type ID' } };
  }

  const customType = await customProductTypeRepository.findOneForStoreById(id, storeId);
  if (!customType) {
    return { ok: false, status: 404, payload: { success: false, message: 'Custom product type not found' } };
  }

  if (body.displayName) customType.displayName = body.displayName;
  if (body.description !== undefined) customType.description = body.description;
  if (body.icon) customType.icon = body.icon;
  if (body.color) customType.color = body.color;
  if (body.variantFields) customType.variantFields = body.variantFields;
  if (body.isActive !== undefined) customType.isActive = body.isActive;

  if (body.fields) {
    const fieldsMap = normalizeFieldsMap(body.fields);
    customType.fields = fieldsMap;
  }

  customType.dateUpdated = new Date();

  const updatedType = await customProductTypeRepository.save(customType);
  return {
    ok: true,
    status: 200,
    payload: { success: true, data: updatedType.toProductTypeConfig(), message: 'Custom product type updated successfully' },
  };
}

async function deleteCustomProductType({ storeId, id }) {
  if (!storeId) {
    return { ok: false, status: 400, payload: { success: false, message: 'Store ID is required' } };
  }

  if (!mongoose.isValidObjectId(id)) {
    return { ok: false, status: 400, payload: { success: false, message: 'Invalid custom product type ID' } };
  }

  const customType = await customProductTypeRepository.findOneForStoreById(id, storeId);
  if (!customType) {
    return { ok: false, status: 404, payload: { success: false, message: 'Custom product type not found' } };
  }

  const productsUsingType = await productRepository.count({ productType: customType.name, store: storeId });
  if (productsUsingType > 0) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: `Cannot delete custom product type. ${productsUsingType} product(s) are using this type. Please update or delete those products first.`,
      },
    };
  }

  customType.isActive = false;
  customType.dateUpdated = new Date();
  await customProductTypeRepository.save(customType);

  return { ok: true, status: 200, payload: { success: true, message: 'Custom product type deleted successfully' } };
}

module.exports = {
  listCustomProductTypes,
  getCustomProductType,
  createCustomProductType,
  updateCustomProductType,
  deleteCustomProductType,
};

