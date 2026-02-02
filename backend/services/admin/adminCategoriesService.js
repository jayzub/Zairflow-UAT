const categoryRepository = require('../../repositories/admin/categoryRepository');

function generateSlug(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Name parameter is required and must be a string');
  }
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlugForStore({ storeId, name, providedSlug }) {
  let slug = providedSlug || generateSlug(name);
  const originalSlug = slug;
  let counter = 1;

  // Ensure uniqueness within store
  while (await categoryRepository.existsForStoreBySlug(storeId, slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function listCategoriesForStore(storeId) {
  return categoryRepository.findAllForStoreWithTree(storeId);
}

async function listCategoriesForParentSelection(storeId) {
  return categoryRepository.findForStoreParentSelection(storeId);
}

async function getCategoryForEdit({ storeId, categoryId }) {
  return categoryRepository.findOneForStoreById(storeId, categoryId);
}

async function createCategory({ storeId, body }) {
  const { name, description, parent, displayOrder, isActive, slug: providedSlug } = body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: 'Category name is required and must be a non-empty string',
        receivedData: { name, description, parent, displayOrder, isActive, slug: providedSlug },
      },
    };
  }

  const trimmedName = name.trim();

  const existingCategory = await categoryRepository.findOneForStoreByName(storeId, trimmedName);
  if (existingCategory) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: `A category with the name "${trimmedName}" already exists in your store`,
      },
    };
  }

  const slug = await generateUniqueSlugForStore({ storeId, name: trimmedName, providedSlug });

  // Handle allowedProductTypes (preserve current controller behavior)
  let allowedProductTypes = [];
  if (body.allowedProductTypes) {
    if (Array.isArray(body.allowedProductTypes)) {
      allowedProductTypes = body.allowedProductTypes;
    } else if (typeof body.allowedProductTypes === 'string') {
      try {
        allowedProductTypes = JSON.parse(body.allowedProductTypes);
      } catch {
        allowedProductTypes = [body.allowedProductTypes];
      }
    }
  }

  const categoryData = {
    name: trimmedName,
    slug,
    description,
    parent: parent || null,
    displayOrder: displayOrder || 0,
    isActive: isActive !== 'false',
    allowedProductTypes: allowedProductTypes.length > 0 ? allowedProductTypes : undefined,
    store: storeId,
  };

  try {
    const category = await categoryRepository.create(categoryData);
    return {
      ok: true,
      status: 201,
      payload: {
        success: true,
        message: 'Category created successfully',
        data: category,
      },
    };
  } catch (error) {
    // Preserve existing duplicate key handling semantics
    if (error?.code === 11000) {
      if (error.keyPattern && (error.keyPattern.name || error.keyValue?.name)) {
        return {
          ok: false,
          status: 400,
          payload: {
            success: false,
            message: `A category with the name "${error.keyValue?.name || trimmedName}" already exists in your store`,
          },
        };
      }
      if (error.keyPattern && (error.keyPattern.slug || error.keyValue?.slug)) {
        return {
          ok: false,
          status: 400,
          payload: {
            success: false,
            message: `A category with the slug "${error.keyValue?.slug || slug}" already exists in your store`,
          },
        };
      }
      return {
        ok: false,
        status: 400,
        payload: {
          success: false,
          message: 'A category with these details already exists in your store',
        },
      };
    }

    return {
      ok: false,
      status: 500,
      payload: {
        success: false,
        message: 'Error creating category',
        error: error?.message,
      },
    };
  }
}

async function updateCategory({ storeId, categoryId, body }) {
  const { name, description, parent, displayOrder, isActive } = body || {};

  const category = await categoryRepository.findOneForStoreById(storeId, categoryId);
  if (!category) return { ok: false, reason: 'not_found' };

  const updateData = {
    name,
    description,
    parent: parent || null,
    displayOrder: displayOrder || 0,
    isActive: isActive !== 'false',
  };

  const updatedCategory = await categoryRepository.updateOneForStoreById(storeId, categoryId, updateData);
  return { ok: true, category: updatedCategory };
}

async function deleteCategory({ storeId, categoryId }) {
  const category = await categoryRepository.findOneForStoreById(storeId, categoryId);
  if (!category) return { ok: false, reason: 'not_found' };

  const hasChildren = await categoryRepository.existsChildrenForStore(storeId, categoryId);
  if (hasChildren) return { ok: false, reason: 'has_children' };

  await categoryRepository.deleteOneForStoreById(storeId, categoryId);
  return { ok: true };
}

async function getCategoryStats(storeId) {
  return categoryRepository.aggregateStatsForStore(storeId);
}

module.exports = {
  listCategoriesForStore,
  listCategoriesForParentSelection,
  getCategoryForEdit,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
};

