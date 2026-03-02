/**
 * CSV row to product data mapper for bulk product import.
 * Maps raw CSV row (from csv-parse with columns: true) to product payload
 * suitable for createProduct-style processing.
 *
 * Variant _id: Do not include _id in CSV — MongoDB assigns on save.
 * If present in JSON, it is stripped. See docs/VARIANT_ID_IMPLEMENTATION.md.
 */

const { parseField } = require('./productHelpers');

const VARIANT_FIELDS = ['size', 'color', 'colorHex', 'price', 'salePrice', 'sku', 'countInStock'];

/**
 * Normalize column key for lookup: lowercase, no spaces
 */
function toLookupKey(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Normalize row keys for case-insensitive lookup
 */
function normalizeRow(row) {
  if (!row || typeof row !== 'object') return {};
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [toLookupKey(k), v])
  );
}

/** CSV column (lowercase, no spaces) -> product field name */
const COLUMN_TO_FIELD = {
  name: 'name',
  description: 'description',
  producttype: 'productType',
  price: 'price',
  saleprice: 'salePrice',
  countinstock: 'countInStock',
  brand: 'brand',
  tags: 'tags',
  category: 'category',
  vendor: 'vendor',
  isactive: 'isActive',
  isfeatured: 'isFeatured',
  metatitle: 'metaTitle',
  metadescription: 'metaDescription',
  variants: 'variants',
  material: 'material',
  materialcomposition: 'materialComposition',
  care: 'care',
  fit: 'fit',
  season: 'season',
  gender: 'gender',
  modelnumber: 'modelNumber',
  specifications: 'specifications',
  warranty: 'warranty',
  dimensions: 'dimensions',
  weight: 'weight',
  materials: 'materials',
  isassembly: 'isAssembly',
  style: 'style',
  roomtype: 'roomType',
  author: 'author',
  publisher: 'publisher',
  isbn: 'isbn',
  language: 'language',
  format: 'format',
  genre: 'genre',
  pages: 'pages',
  publicationdate: 'publicationDate',
  ingredients: 'ingredients',
  nutritionalinfo: 'nutritionalInfo',
  expirydate: 'expiryDate',
  allergens: 'allergens',
  volume: 'volume',
  sport: 'sport',
  skilllevel: 'skillLevel',
  room: 'room',
  skintype: 'skinType',
};

/**
 * Parse pipe-separated string to array
 */
function parsePipeSeparated(val) {
  if (val == null || val === '') return undefined;
  const str = String(val).trim();
  if (!str) return undefined;
  return str.split('|').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse boolean-like value
 */
function parseBoolean(val) {
  if (val == null || val === '') return undefined;
  const s = String(val).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return undefined;
}

/**
 * Parse number
 */
function parseNumber(val) {
  if (val == null || val === '') return undefined;
  const n = parseFloat(String(val));
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Strip _id from variant objects — MongoDB assigns on save
 */
function stripVariantId(variant) {
  if (!variant || typeof variant !== 'object') return variant;
  const { _id, ...rest } = variant;
  return rest;
}

/**
 * Sanitize JSON string mangled by Excel/Sheets export.
 * Fixes: smart/curly quotes, over-escaped "" (CSV export), backslash escapes.
 */
function sanitizeVariantsJson(str) {
  return str
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // smart/curly quotes -> straight (", ", 〝, 〞, ″, ‶)
    .replace(/\\"/g, '"')       // \" -> "
    .replace(/""/g, '"');       // CSV escaped "" -> " (Excel doubles quotes in CSV)
}

/**
 * Parse variants from CSV cell.
 * Supports:
 * 1. JSON array: [{...},{...}]
 * 2. Simple format: size:color:price:salePrice:sku:stock || ...
 *
 * @param {string} val - Raw cell value
 * @returns {Array|undefined} Array of variant objects (without _id) or undefined
 */
function parseVariants(val) {
  if (val == null || val === '') return undefined;
  const str = String(val).trim();
  if (!str) return undefined;

  // Format 1: JSON array
  if (str.startsWith('[')) {
    let parsed = parseField(str);
    if (!Array.isArray(parsed)) {
      try {
        parsed = JSON.parse(sanitizeVariantsJson(str));
      } catch (e) {
        return undefined;
      }
    }
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .filter(v => v && typeof v === 'object')
      .map(stripVariantId)
      .map(v => {
        const out = {};
        VARIANT_FIELDS.forEach(f => {
          if (v[f] !== undefined && v[f] !== null && v[f] !== '') {
            if (f === 'price' || f === 'salePrice') {
              const n = parseNumber(v[f]);
              if (n !== undefined) out[f] = n;
            } else if (f === 'countInStock') {
              const n = parseInt(String(v[f]), 10);
              if (!Number.isNaN(n)) out[f] = n;
            } else {
              out[f] = String(v[f]).trim();
            }
          }
        });
        return Object.keys(out).length ? out : null;
      })
      .filter(Boolean);
  }

  // Format 2: Simple format size:color:price:salePrice:sku:stock || ...
  if (str.includes('||')) {
    const blocks = str.split('||').map(s => s.trim()).filter(Boolean);
    return blocks
      .map(block => {
        const parts = block.split(':').map(p => p.trim());
        if (parts.length < 6) return null;
        const [size, color, priceStr, salePriceStr, sku, stockStr] = parts;
        const price = parseNumber(priceStr);
        const salePrice = parseNumber(salePriceStr) || undefined;
        const countInStock = parseInt(stockStr, 10);
        const variant = {
          size: size || undefined,
          color: color || undefined,
          price: price !== undefined ? price : undefined,
          salePrice: salePrice,
          sku: sku || undefined,
          countInStock: Number.isNaN(countInStock) ? 0 : countInStock,
        };
        return Object.values(variant).some(v => v !== undefined && v !== '') ? variant : null;
      })
      .filter(Boolean);
  }

  return undefined;
}

/**
 * Map CSV row to product data object.
 * Does not resolve category/vendor by name — that is done in the service.
 *
 * @param {Object} row - CSV row (key-value from csv-parse with columns: true)
 * @returns {Object} - Mapped product data for creation
 */
function mapCsvRowToProductData(row) {
  const r = normalizeRow(row);
  const data = {};

  Object.entries(r).forEach(([lookupKey, val]) => {
    if (val == null || val === '') return;
    const fieldName = COLUMN_TO_FIELD[lookupKey];
    if (!fieldName) return;

    // Special handling
    if (fieldName === 'variants') {
      const variants = parseVariants(val);
      if (variants && variants.length) data.variants = variants;
      return;
    }
    if (fieldName === 'tags') {
      const tags = parsePipeSeparated(val);
      if (tags && tags.length) data.tags = tags;
      return;
    }
    if (fieldName === 'price' || fieldName === 'salePrice' || fieldName === 'countInStock') {
      const n = parseNumber(val);
      if (n !== undefined) data[fieldName] = n;
      return;
    }
    if (fieldName === 'isActive' || fieldName === 'isFeatured') {
      const b = parseBoolean(val);
      if (b !== undefined) data[fieldName] = b;
      return;
    }
    if (fieldName === 'pages') {
      const n = parseInt(String(val), 10);
      if (!Number.isNaN(n)) data[fieldName] = n;
      return;
    }

    // Arrays/objects: pass through; service will parseField
    // weight and warranty are String in Electronics/Furniture — keep as string, not parsed JSON
    if (['materialComposition', 'care', 'specifications', 'dimensions',
      'materials', 'roomType', 'genre', 'ingredients', 'nutritionalInfo',
      'allergens', 'volume', 'isAssembly'].includes(fieldName)) {
      const parsed = parseField(val);
      data[fieldName] = parsed !== undefined ? parsed : val;
      return;
    }

    // String passthrough
    data[fieldName] = String(val).trim();
  });

  return data;
}

module.exports = {
  mapCsvRowToProductData,
  parsePipeSeparated,
  parseBoolean,
  parseNumber,
  parseVariants,
  normalizeRow,
  toLookupKey,
};
