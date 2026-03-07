/**
 * Helper functions for product variants.
 * Used by cart, checkout, and inventory logic.
 */

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

module.exports = {
    findVariantByOptions,
    findVariantById,
    getAvailableStockForItem
};
