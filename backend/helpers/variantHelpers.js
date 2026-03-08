/**
 * Helper functions for product variants.
 * Used by cart, checkout, inventory, and all customer/admin pages.
 *
 * Rule: When a product has variants, use the variant's price, salePrice, and countInStock
 * when a variant is in context (opts.variantId or opts.options). Otherwise use product-level
 * values. When product has no variants, always use product-level.
 */

/**
 * Parse price from API/schema (Decimal128, string, number, or { $numberDecimal }).
 * @returns {number|null}
 */
function parsePrice(value) {
    if (value == null) return null;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') return parseFloat(value) || null;
    if (typeof value === 'object' && value.$numberDecimal != null) return parseFloat(value.$numberDecimal) || null;
    if (typeof value.toString === 'function') return parseFloat(value.toString()) || null;
    return null;
}

/**
 * Find a variant in product.variants that matches the given options (color, size).
 * Uses the same matching logic as cart/checkout: color+size, then color, then size.
 *
 * @param {Object} product - Product document (must have variants array)
 * @param {Object} options - { color?: string, size?: string }
 * @returns {{ variant: Object, variantId: ObjectId } | null} - The matching variant and its _id, or null
 */
function findVariantByOptions(product, options = {}) {
    const variants = product && product.variants;
    if (!variants || !Array.isArray(variants) || variants.length === 0) return null;

    const color = (options && options.color != null && options.color !== '')
        ? String(options.color).trim()
        : '';
    const size = (options && options.size != null && options.size !== '')
        ? String(options.size).trim()
        : '';

    let match = null;
    if (color && size) {
        match = variants.find(
            (v) =>
                String(v.color || '').trim() === color &&
                String(v.size || '').trim() === size
        );
    }
    if (!match && color) {
        match = variants.find((v) => String(v.color || '').trim() === color);
    }
    if (!match && size) {
        match = variants.find((v) => String(v.size || '').trim() === size);
    }

    if (!match) return null;
    // match._id may be undefined for variants created before we added _id (legacy)
    return {
        variant: match,
        variantId: match._id || null
    };
}

/**
 * Find a variant by its _id within a product's variants array.
 *
 * @param {Object} product - Product document with variants
 * @param {ObjectId|string} variantId - The variant's _id
 * @returns {Object|null} - The variant object or null
 */
function findVariantById(product, variantId) {
    if (!variantId || !product || !product.variants) return null;
    const idStr = String(variantId);
    return product.variants.find((v) => v._id && String(v._id) === idStr) || null;
}

/**
 * Get available stock for a cart/checkout item. Prefers variantId when present for consistency with
 * order creation and inventory deduction; falls back to options-based lookup (legacy or no variant).
 *
 * @param {Object} product - Product document with optional variants array
 * @param {{ variantId?: ObjectId|string, options?: { color?: string, size?: string } }} opts
 * @returns {number} - Available quantity (0 when variant not found or product has no stock)
 */
function getAvailableStockForItem(product, opts = {}) {
    if (!product) return 0;
    const { variantId, options = {} } = opts;
    if (variantId) {
        const v = findVariantById(product, variantId);
        if (v && v.countInStock != null) return Math.max(0, parseInt(v.countInStock, 10) || 0);
        return 0;
    }
    const result = findVariantByOptions(product, options);
    if (result && result.variant && result.variant.countInStock != null) {
        return Math.max(0, parseInt(result.variant.countInStock, 10) || 0);
    }
    const baseStock = typeof product.countInStock === 'number' ? Math.max(0, product.countInStock) : 0;
    return baseStock;
}

/**
 * Get effective (selling) price for a product with optional variant context.
 * When product has variants and opts identifies one (variantId or options), use that variant's
 * salePrice if valid, else variant's price. Otherwise use product-level price/salePrice.
 *
 * @param {Object} product - Product document
 * @param {{ variantId?: ObjectId|string, options?: { color?: string, size?: string } }} opts
 * @returns {number} - Effective selling price (>= 0)
 */
function getEffectivePrice(product, opts = {}) {
    if (!product) return 0;
    const variant = resolveVariant(product, opts);
    if (variant) {
        const reg = parsePrice(variant.price);
        const sale = parsePrice(variant.salePrice);
        const vPrice = (sale != null && sale > 0 && (reg == null || sale < reg)) ? sale : (reg != null ? reg : 0);
        return typeof vPrice === 'number' && !Number.isNaN(vPrice) ? vPrice : 0;
    }
    const reg = parsePrice(product.price);
    const sale = parsePrice(product.salePrice);
    const price = (sale != null && sale > 0 && (reg == null || sale < reg)) ? sale : (reg != null ? reg : 0);
    return typeof price === 'number' && !Number.isNaN(price) ? price : 0;
}

/**
 * Get effective original (list) price for a product with optional variant context.
 * No sale applied. Uses variant when in context, else product-level.
 *
 * @param {Object} product - Product document
 * @param {{ variantId?: ObjectId|string, options?: { color?: string, size?: string } }} opts
 * @returns {number} - Original/list price (>= 0)
 */
function getEffectiveOriginalPrice(product, opts = {}) {
    if (!product) return 0;
    const variant = resolveVariant(product, opts);
    if (variant) {
        const vReg = parsePrice(variant.price);
        return (vReg != null && !Number.isNaN(vReg)) ? vReg : 0;
    }
    const reg = parsePrice(product.price);
    return (reg != null && !Number.isNaN(reg)) ? reg : 0;
}

/**
 * Get effective count in stock for a product with optional variant context.
 * Alias for getAvailableStockForItem for naming consistency with getEffectivePrice.
 *
 * @param {Object} product - Product document
 * @param {{ variantId?: ObjectId|string, options?: { color?: string, size?: string } }} opts
 * @returns {number}
 */
function getEffectiveCountInStock(product, opts = {}) {
    return getAvailableStockForItem(product, opts);
}

/**
 * Resolve variant from product by variantId or options. Returns the variant object or null.
 * @private
 */
function resolveVariant(product, opts = {}) {
    if (!product || !product.variants || !Array.isArray(product.variants) || product.variants.length === 0) return null;
    const { variantId, options = {} } = opts;
    if (variantId) {
        return findVariantById(product, variantId);
    }
    const result = findVariantByOptions(product, options);
    return result ? result.variant : null;
}

/**
 * Get display values for a product when no specific variant is selected (e.g. listing, cards).
 * When product has variants: uses min price, min valid sale price, and sum of variant stock.
 * When product has no variants: uses product-level price, salePrice, countInStock.
 *
 * @param {Object} product - Product document (with optional variants array)
 * @returns {{ price: number, salePrice: number|null, countInStock: number }}
 */
function getDisplayValues(product) {
    if (!product) return { price: 0, salePrice: null, countInStock: 0 };
    const variants = product.variants;
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
        const price = parsePrice(product.price);
        const sale = parsePrice(product.salePrice);
        const reg = price != null ? price : 0;
        const salePrice = (sale != null && sale > 0 && (reg === 0 || sale < reg)) ? sale : null;
        const countInStock = typeof product.countInStock === 'number' ? Math.max(0, product.countInStock) : 0;
        return { price: reg, salePrice, countInStock };
    }
    let minPrice = null;
    let minSalePrice = null;
    let totalStock = 0;
    for (const v of variants) {
        const vp = parsePrice(v.price);
        if (vp != null && !Number.isNaN(vp)) {
            minPrice = minPrice === null ? vp : Math.min(minPrice, vp);
        }
        const vs = parsePrice(v.salePrice);
        if (vs != null && vs > 0 && (vp == null || vs < vp)) {
            minSalePrice = minSalePrice === null ? vs : Math.min(minSalePrice, vs);
        }
        const st = typeof v.countInStock === 'number' ? Math.max(0, v.countInStock) : 0;
        totalStock += st;
    }
    return {
        price: minPrice != null ? minPrice : 0,
        salePrice: minSalePrice,
        countInStock: totalStock
    };
}

module.exports = {
    parsePrice,
    findVariantByOptions,
    findVariantById,
    getAvailableStockForItem,
    getEffectivePrice,
    getEffectiveOriginalPrice,
    getEffectiveCountInStock,
    getDisplayValues
};
