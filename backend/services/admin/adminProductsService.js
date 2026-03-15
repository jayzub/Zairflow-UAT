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
  getBaseListFilter,
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

/** Fields that are single Date in product schemas; form may send them as arrays. */
const SINGLE_DATE_FIELDS = ['expiryDate', 'publicationDate'];

function normalizeProductDateFields(data) {
  if (!data || typeof data !== 'object') return;
  for (const key of SINGLE_DATE_FIELDS) {
    if (!(key in data)) continue;
    const val = data[key];
    if (Array.isArray(val)) {
      const first = val[0];
      data[key] = first != null && first !== '' ? new Date(first) : undefined;
    } else if (val != null && val !== '') {
      data[key] = val instanceof Date ? val : new Date(val);
    }
  }
}

/** Return a single Date for schema fields that expect one value (form may send array). */
function toSingleDate(val) {
  if (val == null || val === '') return undefined;
  if (Array.isArray(val)) {
    const first = val[0];
    return first != null && first !== '' ? new Date(first) : undefined;
  }
  return val instanceof Date ? val : new Date(val);
}

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
  const base = getBaseListFilter(req);
  const { discountExpr } = require('../../helpers/productHelpers');
  const discountFilter = { ...base, $expr: discountExpr };

  const [
    productList,
    productCount,
    allCount,
    publishedCount,
    draftsCount,
    onDiscountCount,
    featuredCount,
    categories,
    vendors,
    allowedProductTypes,
  ] = await Promise.all([
    productRepository.aggregate(aggregationPipeline),
    productRepository.count(filter),
    productRepository.count(base),
    productRepository.count({ ...base, isActive: true }),
    productRepository.count({ ...base, isActive: false }),
    productRepository.count(discountFilter),
    productRepository.count({ ...base, isFeatured: true }),
    require('../../models/category').find(categoryFilter),
    storeId ? require('../../models/vendor').find({ store: storeId, isActive: true }).select('name _id').lean() : Promise.resolve([]),
    getAllowedProductTypesForStore(storeId).then(types => types || []),
  ]);

  const totalPages = Math.ceil(productCount / limit);
  const serializedProducts = serializeProducts(productList);
  const currentFilter = (req.query.filter || 'all').toLowerCase();

  const result = {
    pageTitle: 'Product List',
    products: serializedProducts,
    categories: categories.map((cat) => cat.toObject()),
    vendors: vendors || [],
    allowedProductTypes: Array.isArray(allowedProductTypes) ? allowedProductTypes : [],
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    productCount,
    limit,
    featuredProductsCount: featuredCount,
    filterCounts: {
      all: allCount,
      published: publishedCount,
      drafts: draftsCount,
      onDiscount: onDiscountCount,
      featured: featuredCount,
    },
    currentFilter: ['all', 'published', 'drafts', 'discount', 'featured'].includes(currentFilter) ? currentFilter : 'all',
    queryCategories: req.query.categories || '',
    queryVendor: req.query.vendor || '',
    queryMinPrice: req.query.minPrice != null && req.query.minPrice !== '' ? String(req.query.minPrice) : '',
    queryMaxPrice: req.query.maxPrice != null && req.query.maxPrice !== '' ? String(req.query.maxPrice) : '',
    queryProductType: req.query.productType || '',
    querySearch: (req.query.search || req.query.q || '').trim(),
    pageRange: getPageRange(page, totalPages),
    api: process.env.API_URL || '/api',
  };

  await storeCache.set(cacheKey, result);
  return { ok: true, fromCache: false, isAjax, result };
}

/** Search products, categories, and vendors for navbar global search. Returns { totalCount, products, categories, vendors }. */
async function searchForNav(req) {
  const q = (req.query.q || req.query.search || '').trim();
  const limitProducts = Math.min(parseInt(req.query.limit, 10) || 8, 20);
  const limitCategories = 5;
  const limitVendors = 5;
  if (!q) {
    return { totalCount: 0, products: [], categories: [], vendors: [] };
  }
  const storeId = req.store && req.store._id ? req.store._id : null;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchRegex = new RegExp(escaped, 'i');

  const productFilter = buildProductFilter({ ...req, query: { ...req.query, search: q, q } });
  const productPipeline = [
    { $match: productFilter },
    { $sort: { dateCreated: -1, _id: 1 } },
    { $limit: limitProducts },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        image: 1,
        dateCreated: 1,
        productType: 1,
        category: 1
      }
    }
  ];

  const Category = require('../../models/category');
  const Vendor = require('../../models/vendor');
  const categoryFilter = { name: searchRegex, isActive: true };
  if (storeId) categoryFilter.store = storeId;
  const vendorFilter = { name: searchRegex, isActive: true };
  if (storeId) vendorFilter.store = storeId;

  const [productResult, productCount, categories, vendors] = await Promise.all([
    productRepository.aggregate(productPipeline),
    productRepository.count(productFilter),
    Category.find(categoryFilter).select('name _id').sort({ name: 1 }).limit(limitCategories).lean(),
    Vendor.find(vendorFilter).select('name _id').sort({ name: 1 }).limit(limitVendors).lean()
  ]);

  const adminBaseProducts = '/admin/products';
  const productsForNav = productResult.map((p) => {
    const img = p.image && p.image.url ? p.image.url : 'https://res.cloudinary.com/dciyc3p3k/image/upload/v1736790957/products/product-Product-0-95f1d3e2';
    const catName = (p.category && p.category[0] && p.category[0].name) ? p.category[0].name : '';
    const subtitle = p.dateCreated
      ? new Date(p.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : catName;
    return {
      id: p._id.toString(),
      name: p.name || 'Product',
      imageUrl: img,
      subtitle: subtitle || '',
      url: `${adminBaseProducts}/edit/${p._id}`
    };
  });

  const categoriesForNav = (categories || []).map((c) => ({
    id: c._id.toString(),
    name: c.name || 'Category',
    url: `/admin/categories/edit/${c._id}`
  }));

  const vendorsForNav = (vendors || []).map((v) => ({
    id: v._id.toString(),
    name: v.name || 'Vendor',
    url: `/admin/vendors/edit/${v._id}`
  }));

  const totalCount = productCount + (categoriesForNav.length) + (vendorsForNav.length);
  return {
    totalCount,
    products: productsForNav,
    categories: categoriesForNav,
    vendors: vendorsForNav
  };
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
  // Dedupe by string id so we don't store the same category twice
  const categoryIds = [...new Set((categories || []).map((c) => String(c)).filter(Boolean))];

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

  if (categoryIds && categoryIds.length > 0) {
    for (const categoryId of categoryIds) {
      if (!isValidObjectId(categoryId, mongoose)) {
        return { ok: false, status: 400, payload: { success: false, message: `Invalid category ID ${categoryId}` } };
      }
      const categoryExists = await categoryRepository.findOneForStoreById(storeId, categoryId);
      if (!categoryExists) {
        return { ok: false, status: 404, payload: { success: false, message: `Category not found ${categoryId}` } };
      }
    }

    const compatibility = await validateProductCategoryCompatibility(body.productType, categoryIds, storeId);
    if (!compatibility.valid) {
      return { ok: false, status: 400, payload: { success: false, message: compatibility.message } };
    }
  }

  const ProductModel = productTypeModelMap[body.productType] || BaseProduct;

  const createImages = mergeImages([], req.files || []);
  const productData = {
    ...body,
    store: storeId,
    category: categoryIds,
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

  productData.images = createImages;
  productData.image = createImages[0] || {};

  // Map status (draft | published) to isActive: draft => false, published => true
  const status = (body.status || 'draft').toLowerCase();
  productData.isActive = status === 'published' || status === 'publish';
  if (body.isActive !== undefined && typeof body.isActive === 'boolean') productData.isActive = body.isActive;

  // Preserve existing controller behavior (init nested fields)
  initProductFields(productData);

  normalizeProductDateFields(productData);

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
  parsed.categories = [...new Set((parsed.categories || []).map((c) => String(c)).filter(Boolean))];
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
        publicationDate: toSingleDate(body.publicationDate),
        ...variantUpdate,
      });
      break;
    case 'Food':
      Object.assign(updateData, {
        brand: body.brand,
        ingredients: parsed.ingredients || [],
        nutritionalInfo: parsed.nutritionalInfo,
        expiryDate: toSingleDate(body.expiryDate),
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
        expiryDate: toSingleDate(body.expiryDate),
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
  searchForNav,
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

