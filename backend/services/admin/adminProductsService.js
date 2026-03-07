require('dotenv').config();

const productRepository = require('../../repositories/admin/productRepository');
const categoryRepository = require('../../repositories/admin/categoryRepository');
const vendorRepository = require('../../repositories/admin/vendorRepository');
const storeCache = require('../../utils/cache');

const sanitizeHtml = require('sanitize-html');
const cloudinary = require('../../config/cloudinary');
const { sanitizeOptions } = require('../../helpers/sanitizeOptions');

const {
  buildAggregationPipeline,
  buildProductFilter,
  convertVariantPrices,
  fetchCategoriesAndVendors,
  fetchProductWithRelated,
  getAllowedProductTypesForStore,
  getPageRange,
  getProductTypes,
  initProductFields,
  isValidObjectId,
  mergeImages,
  parseField,
  parseUpdateFields,
  prepareUpdateData,
  productTypeModelMap,
  resolveStoreId,
  serializeProducts,
  validateProductCategoryCompatibility,
  validateProductTypeForStore,
} = require('../../helpers/productHelpers');

const BaseProduct = require('../../models/products/baseProduct');
const { mapCsvRowToProductData } = require('../../helpers/csvProductMapper');
const { parse } = require('csv-parse/sync');

function isAjaxRequestFromReq(req) {
  return (
    req.xhr ||
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    req.headers['accept'] === 'application/json'
  );
}

async function listProducts({ req, limit, page, sort, order }) {
  const filter = buildProductFilter(req);
  const isAjax = isAjaxRequestFromReq(req);

  const cacheKey = `admin_products:${JSON.stringify({ page, limit, sort, order, filter, isAjax })}`;
  const cachedResult = await storeCache.get(cacheKey);
  if (cachedResult && !isAjax) {
    return { ok: true, fromCache: true, isAjax, result: cachedResult };
  }

  const skip = (page - 1) * limit;
  const aggregationPipeline = buildAggregationPipeline(filter, sort, order, skip, limit);

  const storeId = req.store?._id;
  const categoryFilter =
    !req.user.isPlatformAdmin && req.store ? { store: storeId, isActive: true } : { isActive: true };

  const [productList, productCount, featuredProductsCount, categories] = await Promise.all([
    productRepository.aggregate(aggregationPipeline),
    productRepository.count(filter),
    productRepository.count({ ...filter, isFeatured: true }),
    // keep this query in repo layer
    require('../../models/category').find(categoryFilter),
  ]);

  const totalPages = Math.ceil(productCount / limit);
  const serializedProducts = serializeProducts(productList);

  const result = {
    pageTitle: 'Product List',
    products: serializedProducts,
    categories: categories.map((cat) => cat.toObject()),
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    productCount,
    limit,
    featuredProductsCount,
    pageRange: getPageRange(page, totalPages),
    api: process.env.API_URL || '/api',
  };

  await storeCache.set(cacheKey, result);
  return { ok: true, fromCache: false, isAjax, result };
}

function buildDeletedProductFilter(req) {
  const base = { isDeleted: true };
  if (!req.user.isPlatformAdmin && req.store) {
    base.store = req.store._id;
  }
  return base;
}

async function listDeletedProducts({ req, limit, page, sort, order }) {
  const filter = buildDeletedProductFilter(req);
  const skip = (page - 1) * limit;
  const aggregationPipeline = buildAggregationPipeline(filter, sort, order, skip, limit);

  const [productList, productCount] = await Promise.all([
    productRepository.aggregate(aggregationPipeline),
    productRepository.count(filter),
  ]);

  const totalPages = Math.ceil(productCount / limit);
  const serializedProducts = serializeProducts(productList);

  return {
    ok: true,
    result: {
      pageTitle: 'Removed from catalog',
      products: serializedProducts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      productCount,
      limit,
      pageRange: getPageRange(page, totalPages),
      api: process.env.API_URL || '/api',
    },
  };
}

async function getAddProductPageData({ storeId }) {
  const productTypes = getProductTypes(BaseProduct);
  const { categories, vendors } = await fetchCategoriesAndVendors(storeId);
  const allowedProductTypes = storeId ? await getAllowedProductTypesForStore(storeId) : productTypes;

  return {
    pageTitle: 'Add Product',
    categories,
    vendors,
    productTypes: allowedProductTypes,
    allProductTypes: productTypes,
  };
}

async function createProduct({ req }) {
  const { body } = req;
  const mongoose = require('mongoose');

  if (body.description) {
    body.description = sanitizeHtml(body.description, sanitizeOptions);
  }

  const storeId = resolveStoreId(req, body);
  if (!storeId) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: 'Store ID is required. Please specify a store you have access to.',
      },
    };
  }

  const categories = body.category
    ? Array.isArray(body.category)
      ? body.category
      : parseField(body.category)
    : [];

  const tags = body.tags ? (Array.isArray(body.tags) ? body.tags : parseField(body.tags)) : [];

  const materialComposition = parseField(body.materialComposition);
  const care = parseField(body.care);
  const variants = parseField(body.variants);
  const materials = parseField(body.materials);
  const roomType = parseField(body.roomType);
  const isAssembly = parseField(body.isAssembly);
  const specifications = parseField(body.specifications);
  const dimensions = parseField(body.dimensions);
  const weight = parseField(body.weight);
  const nutritionalInfo = parseField(body.nutritionalInfo);
  const genre = parseField(body.genre);
  const ingredients = parseField(body.ingredients);
  const allergens = parseField(body.allergens);
  const volume = parseField(body.volume);

  if (body.vendor) {
    if (!isValidObjectId(body.vendor, mongoose)) {
      return { ok: false, status: 400, payload: { success: false, message: 'Invalid vendor ID' } };
    }
    const vendorExists = await vendorRepository.findOneForStoreById(storeId, body.vendor);
    if (!vendorExists) {
      return { ok: false, status: 404, payload: { success: false, message: 'Vendor not found' } };
    }
  }

  if (!body.productType) {
    return {
      ok: false,
      status: 400,
      payload: { success: false, message: 'Product type is required. Please select a product type.' },
    };
  }

  const validProductTypes = await getAllowedProductTypesForStore(storeId);
  if (!validProductTypes.includes(body.productType)) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}`,
      },
    };
  }

  const storeValidation = await validateProductTypeForStore(body.productType, storeId);
  if (!storeValidation.valid) {
    return { ok: false, status: 400, payload: { success: false, message: storeValidation.message } };
  }

  if (categories && categories.length > 0) {
    for (const categoryId of categories) {
      if (!isValidObjectId(categoryId, mongoose)) {
        return { ok: false, status: 400, payload: { success: false, message: `Invalid category ID ${categoryId}` } };
      }
      const categoryExists = await categoryRepository.findOneForStoreById(storeId, categoryId);
      if (!categoryExists) {
        return { ok: false, status: 404, payload: { success: false, message: `Category not found ${categoryId}` } };
      }
    }

    const compatibility = await validateProductCategoryCompatibility(body.productType, categories, storeId);
    if (!compatibility.valid) {
      return { ok: false, status: 400, payload: { success: false, message: compatibility.message } };
    }
  }

  const ProductModel = productTypeModelMap[body.productType] || BaseProduct;

  const productData = {
    ...body,
    store: storeId,
    category: categories,
    tags,
    materialComposition,
    care,
    variants,
    materials,
    roomType,
    isAssembly,
    specifications,
    dimensions,
    weight,
    nutritionalInfo,
    genre,
    ingredients,
    allergens,
    volume,
  };

  // Preserve existing controller behavior (init nested fields)
  initProductFields(productData);

  const product = new ProductModel(productData);
  await product.save();

  return { ok: true, status: 201, payload: { success: true, data: product, message: 'Product created successfully!' } };
}

async function getEditProductPageData({ req, productId }) {
  const storeId = req.user?.isPlatformAdmin ? null : req.store?._id;
  return fetchProductWithRelated(productId, storeId);
}

async function updateProduct({ req, productId }) {
  const mongoose = require('mongoose');
  if (!isValidObjectId(productId, mongoose)) {
    return { ok: false, status: 400, payload: { success: false, message: 'Invalid Product ID' } };
  }

  const storeId = req.user?.isPlatformAdmin ? null : req.store?._id;
  const product = storeId
    ? await productRepository.findOne({ _id: productId, store: storeId })
    : await productRepository.findById(productId);

  if (!product) return { ok: false, status: 404, payload: { success: false, message: 'Product not found' } };

  const { body } = req;
  if (body.description) body.description = sanitizeHtml(body.description, sanitizeOptions);

  const parsed = parseUpdateFields(body);
  const price = body.price
    ? mongoose.Types.Decimal128.fromString(body.price.toString())
    : mongoose.Types.Decimal128.fromString('0');
  const salePrice = body.salePrice ? mongoose.Types.Decimal128.fromString(body.salePrice.toString()) : null;

  // Validate categories on update (same checks as create): IDs valid + belong to store, and product-type compatibility
  const categories = parsed.categories;
  const storeIdForValidation = storeId || product.store;
  if (categories && categories.length > 0 && storeIdForValidation) {
    for (const categoryId of categories) {
      if (!isValidObjectId(categoryId, mongoose)) {
        return { ok: false, status: 400, payload: { success: false, message: `Invalid category ID ${categoryId}` } };
      }
      const categoryExists = await categoryRepository.findOneForStoreById(storeIdForValidation, categoryId);
      if (!categoryExists) {
        return { ok: false, status: 404, payload: { success: false, message: `Category not found: ${categoryId}` } };
      }
    }
    const compatibility = await validateProductCategoryCompatibility(product.productType, categories, storeIdForValidation);
    if (!compatibility.valid) {
      return { ok: false, status: 400, payload: { success: false, message: compatibility.message } };
    }
  }

  const images = mergeImages(product.images, req.files);
  const updateData = prepareUpdateData(body, parsed, images, price, salePrice);
  const hasVariantsInBody = parsed.variants != null && Array.isArray(parsed.variants);
  const convertedVariants = hasVariantsInBody ? convertVariantPrices(parsed.variants) : [];

  const variantUpdate = hasVariantsInBody ? { variants: convertedVariants } : {};

  switch (product.productType) {
    case 'Clothing':
      Object.assign(updateData, {
        material: body.material,
        materialComposition: parsed.materialComposition || [],
        care: parsed.care || [],
        fit: body.fit,
        season: body.season,
        gender: body.gender,
        ...variantUpdate,
      });
      break;
    case 'Electronics':
      Object.assign(updateData, {
        specifications: parsed.specifications,
        warranty: parsed.warranty,
        dimensions: parsed.dimensions,
        weight: parsed.weight,
        ...variantUpdate,
      });
      break;
    case 'Furniture':
      Object.assign(updateData, {
        dimensions: parsed.dimensions,
        weight: parsed.weight,
        materials: parsed.materials,
        isAssembly: parsed.isAssembly,
        style: body.style,
        capacity: body.capacity,
        roomType: parsed.roomType,
        warranty: parsed.warranty,
        ...variantUpdate,
      });
      break;
    case 'Books':
      Object.assign(updateData, {
        author: body.author,
        publisher: body.publisher,
        isbn: body.isbn,
        language: body.language,
        format: body.format,
        genre: parsed.genre || [],
        pages: body.pages,
        publicationDate: body.publicationDate,
        ...variantUpdate,
      });
      break;
    case 'Food':
      Object.assign(updateData, {
        brand: body.brand,
        ingredients: parsed.ingredients || [],
        nutritionalInfo: parsed.nutritionalInfo,
        expiryDate: body.expiryDate,
        allergens: parsed.allergens || [],
        ...variantUpdate,
      });
      break;
    case 'Sports':
      Object.assign(updateData, {
        sport: body.sport,
        skillLevel: body.skillLevel,
        material: body.material,
        weight: parsed.weight,
        ...variantUpdate,
      });
      break;
    case 'HomeGarden':
      Object.assign(updateData, {
        room: body.room,
        material: body.material,
        dimensions: parsed.dimensions,
        ...variantUpdate,
      });
      break;
    case 'HealthBeauty':
      Object.assign(updateData, {
        brand: body.brand,
        skinType: body.skinType,
        ingredients: parsed.ingredients || [],
        volume: parsed.volume,
        expiryDate: body.expiryDate,
        ...variantUpdate,
      });
      break;
  }

  const ProductModel = productTypeModelMap[product.productType] || BaseProduct;
  const updateOptions = { new: true, runValidators: true };
  const updatedProduct = storeId
    ? await ProductModel.findOneAndUpdate({ _id: productId, store: storeId }, updateData, updateOptions)
    : await ProductModel.findByIdAndUpdate(productId, updateData, updateOptions);

  // Clear product caches (preserve controller behavior)
  const cacheKeys = await storeCache.keys();
  for (const key of cacheKeys) {
    if (key.startsWith('products:') || key.startsWith('admin_products:')) {
      await storeCache.del(key);
    }
  }

  return {
    ok: true,
    status: 200,
    payload: { success: true, data: updatedProduct, message: 'Product updated successfully!' },
  };
}

async function removeProductSoft({ req, productId }) {
  const mongoose = require('mongoose');
  if (!mongoose.isValidObjectId(productId)) {
    return { ok: false, status: 400, payload: { success: false, message: 'Invalid Product ID' } };
  }

  const storeId = req.user?.isPlatformAdmin ? null : req.store?._id;
  const deletedProduct = storeId
    ? await productRepository.findOneAndUpdate({ _id: productId, store: storeId }, { isDeleted: true }, { new: true })
    : await productRepository.findByIdAndUpdate(productId, { isDeleted: true }, { new: true });

  if (!deletedProduct) return { ok: false, status: 404, payload: { success: false, message: 'Product not found' } };

  return { ok: true, status: 200, payload: { success: true, message: 'Product marked as deleted successfully' } };
}

async function restoreProductSoft({ req, productId }) {
  const mongoose = require('mongoose');
  if (!mongoose.isValidObjectId(productId)) {
    return { ok: false, status: 400, payload: { success: false, message: 'Invalid Product ID' } };
  }

  const storeId = req.user?.isPlatformAdmin ? null : req.store?._id;
  const restoredProduct = storeId
    ? await productRepository.findOneAndUpdate(
        { _id: productId, store: storeId, isDeleted: true },
        { isDeleted: false },
        { new: true }
      )
    : await productRepository.findOneAndUpdate(
        { _id: productId, isDeleted: true },
        { isDeleted: false },
        { new: true }
      );

  if (!restoredProduct) {
    return { ok: false, status: 404, payload: { success: false, message: 'Product not found or not in removed list' } };
  }

  return { ok: true, status: 200, payload: { success: true, message: 'Product restored successfully' } };
}

async function deleteProductHard({ req, productId }) {
  const storeId = req.user?.isPlatformAdmin ? null : req.store?._id;
  const product = storeId
    ? await productRepository.findOne({ _id: productId, store: storeId })
    : await productRepository.findById(productId);

  if (!product) return { ok: false, status: 404, payload: { success: false, message: 'Product not found' } };

  if (product.image && product.image.public_id) {
    await cloudinary.uploader.destroy(product.image.public_id);
  }

  if (storeId) await productRepository.findOneAndDelete({ _id: productId, store: storeId });
  else await productRepository.findByIdAndDelete(productId);

  return { ok: true, status: 200, payload: { success: true, message: 'Product deleted successfully' } };
}

async function getProductCount({ req }) {
  const storeId = req.user?.isPlatformAdmin ? null : req.store?._id;
  const filter = storeId ? { store: storeId, isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
  const count = await productRepository.count(filter);
  return { ok: true, status: 200, payload: { success: true, data: { count } } };
}

async function getFeaturedProducts({ req, count }) {
  const storeId = req.user?.isPlatformAdmin ? null : req.store?._id;
  const filter = storeId
    ? { isFeatured: true, store: storeId, isDeleted: { $ne: true } }
    : { isFeatured: true, isDeleted: { $ne: true } };
  const products = await BaseProduct.find(filter).limit(count);
  return { ok: true, status: 200, payload: { success: true, data: products } };
}

async function bulkImportProducts({ req, file }) {
  const mongoose = require('mongoose');
  const storeId = resolveStoreId(req, req.body || {});
  if (!storeId) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: 'Store ID is required. Please specify a store you have access to.',
      },
    };
  }

  let records;
  try {
    records = parse(file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (parseErr) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: 'Invalid CSV format. Could not parse file.',
        error: process.env.NODE_ENV === 'development' ? parseErr.message : undefined,
      },
    };
  }

  const { MAX_CSV_IMPORT_ROWS } = require('../../config/importLimits');
  if (records.length > MAX_CSV_IMPORT_ROWS) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: `Too many rows. Maximum is ${MAX_CSV_IMPORT_ROWS} data rows (file has ${records.length}).`,
      },
    };
  }

  const validProductTypes = await getAllowedProductTypesForStore(storeId);
  const created = [];
  const errors = [];

  for (let i = 0; i < records.length; i += 1) {
    const rowNum = i + 2; // 1-based, +1 for header
    const row = records[i];

    let body;
    try {
      body = mapCsvRowToProductData(row);
    } catch (mapErr) {
      errors.push({
        row: rowNum,
        message: 'Failed to map row',
        data: process.env.NODE_ENV === 'development' ? row : undefined,
      });
      continue;
    }

    if (!body.name || !body.description || !body.productType) {
      const missing = [];
      if (!body.name) missing.push('name');
      if (!body.description) missing.push('description');
      if (!body.productType) missing.push('productType');
      errors.push({
        row: rowNum,
        message: `Missing required fields: ${missing.join(', ')}`,
        data: { name: body.name, productType: body.productType },
      });
      continue;
    }

    if (!validProductTypes.includes(body.productType)) {
      errors.push({
        row: rowNum,
        message: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}`,
        data: { name: body.name, productType: body.productType },
      });
      continue;
    }

    const storeValidation = await validateProductTypeForStore(body.productType, storeId);
    if (!storeValidation.valid) {
      errors.push({
        row: rowNum,
        message: storeValidation.message,
        data: { name: body.name },
      });
      continue;
    }

    let categoryIds = [];
    if (body.category) {
      const parts = String(body.category).split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (isValidObjectId(part, mongoose)) {
          const cat = await categoryRepository.findOneForStoreById(storeId, part);
          if (!cat) {
            errors.push({
              row: rowNum,
              message: `Category not found: ${part}`,
              data: { name: body.name, category: body.category },
            });
            categoryIds = null;
            break;
          }
          categoryIds.push(cat._id);
        } else {
          const cat = await categoryRepository.findOneForStoreByName(storeId, part);
          if (!cat) {
            errors.push({
              row: rowNum,
              message: `Category not found: ${part}`,
              data: { name: body.name, category: body.category },
            });
            categoryIds = null;
            break;
          }
          categoryIds.push(cat._id);
        }
      }
      if (categoryIds === null) continue;
    }
    body.category = categoryIds;

    if (body.vendor) {
      if (isValidObjectId(body.vendor, mongoose)) {
        const vendor = await vendorRepository.findOneForStoreById(storeId, body.vendor);
        if (!vendor) {
          errors.push({
            row: rowNum,
            message: 'Vendor not found',
            data: { name: body.name, vendor: body.vendor },
          });
          continue;
        }
        body.vendor = vendor._id;
      } else {
        const vendor = await vendorRepository.findOneForStoreByName(storeId, body.vendor);
        if (!vendor) {
          errors.push({
            row: rowNum,
            message: `Vendor not found: ${body.vendor}`,
            data: { name: body.name, vendor: body.vendor },
          });
          continue;
        }
        body.vendor = vendor._id;
      }
    }

    if (categoryIds && categoryIds.length > 0) {
      const compatibility = await validateProductCategoryCompatibility(body.productType, categoryIds, storeId);
      if (!compatibility.valid) {
        errors.push({
          row: rowNum,
          message: compatibility.message,
          data: { name: body.name },
        });
        continue;
      }
    }

    if (body.variants && Array.isArray(body.variants)) {
      body.variants = body.variants.map(v => {
        const { _id: omit, ...rest } = v;
        return rest;
      });
    }

    if (body.description) {
      body.description = sanitizeHtml(body.description, sanitizeOptions);
    }

    const ProductModel = productTypeModelMap[body.productType] || BaseProduct;
    const productData = {
      ...body,
      store: storeId,
    };
    initProductFields(productData);

    try {
      const product = new ProductModel(productData);
      await product.save();
      created.push({ row: rowNum, id: product._id, name: product.name });
    } catch (saveErr) {
      errors.push({
        row: rowNum,
        message: saveErr.message || 'Failed to save product',
        data: process.env.NODE_ENV === 'development' ? { name: body.name } : undefined,
      });
    }
  }

  return {
    ok: true,
    status: 200,
    payload: {
      success: true,
      created: created.length,
      failed: errors.length,
      total: records.length,
      errors,
      createdIds: created.map(c => c.id),
    },
  };
}

module.exports = {
  listProducts,
  listDeletedProducts,
  getAddProductPageData,
  createProduct,
  getEditProductPageData,
  updateProduct,
  removeProductSoft,
  restoreProductSoft,
  deleteProductHard,
  getProductCount,
  getFeaturedProducts,
  bulkImportProducts,
};

