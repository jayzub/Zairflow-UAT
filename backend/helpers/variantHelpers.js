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

module.exports = {
    findVariantByOptions,
    findVariantById
};
