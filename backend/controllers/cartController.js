const Cart = require('../models/cart');
const Product = require('../models/products/baseProduct');
const Store = require('../models/store');
const Promotion = require('../models/promotion');
const { asyncHandler } = require('../middleware/asyncHandler');

/** Default tax rate (0–100) when store has none defined. Set DEFAULT_TAX_RATE in env to override. Phase 3.3 */
const DEFAULT_TAX_RATE = typeof process.env.DEFAULT_TAX_RATE !== 'undefined'
    ? Math.max(0, Math.min(100, parseFloat(process.env.DEFAULT_TAX_RATE) || 0))
    : 0;

/**
 * Parse price from API/schema (Decimal128, string, number, or { $numberDecimal }).
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
 * Resolve regular (list) unit price from product (and variant if options match). No sale applied.
 */
function resolveUnitOriginalPrice(product, options = {}) {
    if (!product) return null;
    const reg = parsePrice(product.price);
    const baseOriginal = reg != null ? reg : 0;

    const variants = product.variants;
    if (!variants || !Array.isArray(variants) || variants.length === 0) return baseOriginal;

    const color = options.color ? String(options.color).trim() : '';
    const size = options.size ? String(options.size).trim() : '';
    let match = null;
    if (color && size) {
        match = variants.find(v => String(v.color || '').trim() === color && String(v.size || '').trim() === size);
    }
    if (!match && color) {
        match = variants.find(v => String(v.color || '').trim() === color);
    }
    if (!match && size) {
        match = variants.find(v => String(v.size || '').trim() === size);
    }
    if (match) {
        const vReg = parsePrice(match.price);
        return vReg != null ? vReg : baseOriginal;
    }
    return baseOriginal;
}

/**
 * Get available stock for product (or matching variant when options provided). Phase 2.4.
 */
function getAvailableStock(product, options = {}) {
    if (!product) return 0;
    const baseStock = typeof product.countInStock === 'number' ? Math.max(0, product.countInStock) : 0;
    const variants = product.variants;
    if (!variants || !Array.isArray(variants) || variants.length === 0) return baseStock;
    const color = options.color ? String(options.color).trim() : '';
    const size = options.size ? String(options.size).trim() : '';
    let match = null;
    if (color && size) {
        match = variants.find(v => String(v.color || '').trim() === color && String(v.size || '').trim() === size);
    }
    if (!match && color) {
        match = variants.find(v => String(v.color || '').trim() === color);
    }
    if (!match && size) {
        match = variants.find(v => String(v.size || '').trim() === size);
    }
    if (match && match.countInStock != null) {
        return Math.max(0, parseInt(match.countInStock, 10) || 0);
    }
    return baseStock;
}

/**
 * Resolve effective unit price from product (and variant if options match).
 */
function resolveUnitPrice(product, options = {}) {
    if (!product) return null;
    const reg = parsePrice(product.price);
    const sale = parsePrice(product.salePrice);
    const basePrice = (sale != null && sale > 0 && (reg == null || sale < reg)) ? sale : (reg != null ? reg : 0);

    const variants = product.variants;
    if (!variants || !Array.isArray(variants) || variants.length === 0) return basePrice;

    const color = options.color ? String(options.color).trim() : '';
    const size = options.size ? String(options.size).trim() : '';
    let match = null;
    if (color && size) {
        match = variants.find(v => String(v.color || '').trim() === color && String(v.size || '').trim() === size);
    }
    if (!match && color) {
        match = variants.find(v => String(v.color || '').trim() === color);
    }
    if (!match && size) {
        match = variants.find(v => String(v.size || '').trim() === size);
    }
    if (match) {
        const vReg = parsePrice(match.price);
        const vSale = parsePrice(match.salePrice);
        return (vSale != null && vSale > 0 && (vReg == null || vSale < vReg)) ? vSale : (vReg != null ? vReg : basePrice);
    }
    return basePrice;
}

/**
 * Serialize cart for API response: ensure numeric prices, unitPrice and unitOriginalPrice on each item.
 */
function serializeCartForResponse(cart) {
    const doc = cart.toObject ? cart.toObject() : cart;
    const items = (doc.items || []).map(item => {
        const product = item.product;
        const unitPrice = item.unitPrice != null && item.unitPrice > 0
            ? item.unitPrice
            : resolveUnitPrice(product, item.options || {});
        const unitOriginalPrice = item.unitOriginalPrice != null && item.unitOriginalPrice >= 0
            ? item.unitOriginalPrice
            : resolveUnitOriginalPrice(product, item.options || {});
        const productObj = product ? {
            ...product,
            price: parsePrice(product.price) ?? 0,
            salePrice: parsePrice(product.salePrice) ?? null
        } : product;
        return {
            ...item,
            unitPrice: unitPrice ?? 0,
            unitOriginalPrice: unitOriginalPrice ?? unitPrice ?? 0,
            product: productObj
        };
    });
    return { ...doc, items };
}

/**
 * Get tax rate for cart from store(s). Store cart = that store's settings.taxRate; marketplace = first item's store or default. Phase 3.3.
 */
async function getTaxRateForCart(cart) {
    const storeId = cart.scopeType === 'store' && cart.store
        ? (cart.store._id || cart.store).toString()
        : (cart.items && cart.items[0] && cart.items[0].store)
            ? (cart.items[0].store._id || cart.items[0].store).toString()
            : null;
    if (!storeId) return DEFAULT_TAX_RATE;
    const store = await Store.findById(storeId).select('settings.taxRate').lean();
    const rate = store && store.settings && (store.settings.taxRate != null)
        ? Number(store.settings.taxRate)
        : DEFAULT_TAX_RATE;
    return Math.max(0, Math.min(100, rate));
}

/**
 * Compute promo discount amount for a given subtotal. Phase 3.1/3.2.
 */
function computePromoDiscount(promo, subtotal) {
    if (!promo || subtotal <= 0) return 0;
    if (promo.minOrder != null && promo.minOrder > 0 && subtotal < promo.minOrder) return 0;
    if (promo.type === 'percentage') {
        const pct = Math.min(100, Math.max(0, Number(promo.value) || 0));
        return Math.round((subtotal * pct / 100) * 100) / 100;
    }
    const fixed = Math.max(0, Number(promo.value) || 0);
    return Math.min(fixed, subtotal);
}

/**
 * Compute cart summary: subtotal, promoDiscount, estimatedTax, estimatedShipping, total. Phase 3.2/3.3.
 */
async function computeCartSummary(cart, serializedCart, taxRate) {
    const items = serializedCart.items || [];
    const subtotal = items.reduce((sum, item) => {
        const price = item.unitPrice != null && item.unitPrice > 0 ? item.unitPrice : 0;
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        return sum + price * qty;
    }, 0);
    let promoDiscount = 0;
    const code = (cart.appliedPromoCode || '').trim().toUpperCase();
    if (code) {
        const storeId = cart.scopeType === 'store' && cart.store ? (cart.store._id || cart.store) : null;
        let promo = await Promotion.findOne({
            code,
            isActive: true,
            $or: [{ store: null }, { store: storeId }]
        }).lean();
        const now = new Date();
        if (promo) {
            if (promo.validFrom && now < new Date(promo.validFrom)) promo = null;
            else if (promo.validTo && now > new Date(promo.validTo)) promo = null;
            else if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) promo = null;
        }
        if (promo) promoDiscount = computePromoDiscount(promo, subtotal);
    }
    const subtotalAfterPromo = Math.max(0, subtotal - promoDiscount);
    const estimatedTax = Math.round(subtotalAfterPromo * (taxRate / 100) * 100) / 100;
    const estimatedShipping = 0; // calculated at checkout
    const total = Math.round((subtotalAfterPromo + estimatedTax + estimatedShipping) * 100) / 100;
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        promoDiscount,
        estimatedTax,
        estimatedShipping,
        total
    };
}

/**
 * Current request context: which cart is visible (store-1, store-2, or marketplace).
 * Uses query scopeType/storeId when present (cart page); else req.store; else marketplace. Phase 3.4.
 */
function getCartContext(req) {
    const q = req.query || {};
    if (q.scopeType === 'store' && q.storeId) {
        return { scopeType: 'store', storeId: String(q.storeId) };
    }
    if (req.store && req.store._id) {
        return { scopeType: 'store', storeId: String(req.store._id) };
    }
    return { scopeType: 'marketplace', storeId: null };
}

/**
 * Resolve cart by scope (store or marketplace). Creates cart if it doesn't exist.
 */
async function getOrCreateCart(customerId, scopeType, storeId = null) {
    const filter = { customer: customerId, scopeType };
    if (scopeType === 'store') {
        if (!storeId) throw new Error('storeId is required for store cart');
        filter.store = storeId;
    } else {
        filter.store = null;
    }
    let cart = await Cart.findOne(filter);
    if (!cart) {
        cart = await Cart.create({
            customer: customerId,
            scopeType,
            store: scopeType === 'store' ? storeId : null,
            items: []
        });
    }
    return cart;
}

/**
 * Get cart for the current context only (store from req.store, or marketplace). Includes Phase 3 summary: subtotal, promoDiscount, estimatedTax, estimatedShipping, total.
 */
const getCart = asyncHandler(async (req, res) => {
    const customerId = req.customer._id;
    const ctx = getCartContext(req);

    const cart = await getOrCreateCart(customerId, ctx.scopeType, ctx.storeId);
    await cart
        .populate([
            { path: 'items.product', select: 'name price salePrice image slug variants' },
            { path: 'items.store', select: 'name slug' },
            { path: 'store', select: 'name slug', strictPopulate: false }
        ]);

    const serialized = serializeCartForResponse(cart);
    const taxRate = await getTaxRateForCart(cart);
    const summary = await computeCartSummary(cart, serialized, taxRate);

    res.json({
        success: true,
        data: { ...serialized, ...summary }
    });
});

/**
 * Add item to cart. Body: productId, quantity, options (optional).
 * Scope is fixed by current context (req.store = that store's cart, else marketplace).
 */
const addCartItem = asyncHandler(async (req, res) => {
    const { productId, quantity = 1, options } = req.body;
    const customerId = req.customer._id;
    const ctx = getCartContext(req);
    const scopeType = ctx.scopeType;
    const storeId = ctx.storeId;

    if (!productId) {
        return res.status(400).json({
            success: false,
            error: 'productId is required'
        });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            error: 'Product not found'
        });
    }
    if (!product.isActive) {
        return res.status(400).json({
            success: false,
            error: 'Product is not available'
        });
    }

    const productStoreId = product.store.toString();
    if (scopeType === 'store') {
        if (productStoreId !== storeId) {
            return res.status(400).json({
                success: false,
                error: 'Product does not belong to this store'
            });
        }
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const available = getAvailableStock(product, options || {});
    const cart = await getOrCreateCart(customerId, scopeType, storeId);

    function optionsMatch(a, b) {
        const colorA = (a && a.color != null && a.color !== '') ? String(a.color).trim() : '';
        const colorB = (b && b.color != null && b.color !== '') ? String(b.color).trim() : '';
        const sizeA = (a && a.size != null && a.size !== '') ? String(a.size).trim() : '';
        const sizeB = (b && b.size != null && b.size !== '') ? String(b.size).trim() : '';
        return colorA === colorB && sizeA === sizeB;
    }

    const existingIndex = cart.items.findIndex(
        (item) =>
            item.product.toString() === productId &&
            item.store.toString() === productStoreId &&
            optionsMatch(item.options, options || {})
    );
    const currentInCart = existingIndex >= 0 ? cart.items[existingIndex].quantity : 0;
    const totalRequested = currentInCart + qty;
    if (totalRequested > available) {
        return res.status(400).json({
            success: false,
            error: available === 0 ? 'This item is out of stock' : `Only ${available} available${currentInCart > 0 ? ` (${currentInCart} already in cart)` : ''}`
        });
    }

    const unitPrice = resolveUnitPrice(product, options || {});
    const unitOriginalPrice = resolveUnitOriginalPrice(product, options || {});

    if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += qty;
        cart.items[existingIndex].unitPrice = unitPrice != null ? unitPrice : cart.items[existingIndex].unitPrice;
        cart.items[existingIndex].unitOriginalPrice = unitOriginalPrice != null ? unitOriginalPrice : cart.items[existingIndex].unitOriginalPrice;
    } else {
        cart.items.push({
            product: productId,
            store: product.store,
            quantity: qty,
            options: options || {},
            unitPrice: unitPrice != null ? unitPrice : null,
            unitOriginalPrice: unitOriginalPrice != null ? unitOriginalPrice : null
        });
    }
    await cart.save();

    await cart.populate([
        { path: 'items.product', select: 'name price salePrice image slug variants' },
        { path: 'items.store', select: 'name slug' },
        { path: 'store', select: 'name slug', strictPopulate: false }
    ]);

    const serializedAdd = serializeCartForResponse(cart);
    const taxRateAdd = await getTaxRateForCart(cart);
    const summaryAdd = await computeCartSummary(cart, serializedAdd, taxRateAdd);

    res.status(201).json({
        success: true,
        data: { ...serializedAdd, ...summaryAdd },
        message: 'Item added to cart'
    });
});

/**
 * Update cart item quantity. Params: itemId (cart item _id). Body: quantity.
 */
const updateCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const customerId = req.customer._id;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
        return res.status(400).json({
            success: false,
            error: 'quantity must be a positive number'
        });
    }

    const cart = await Cart.findOne({ customer: customerId, 'items._id': itemId });
    if (!cart) {
        return res.status(404).json({
            success: false,
            error: 'Cart or item not found'
        });
    }

    const ctx = getCartContext(req);
    const cartStoreId = cart.store ? String(cart.store._id || cart.store) : null;
    if (cart.scopeType !== ctx.scopeType || (ctx.scopeType === 'store' && cartStoreId !== ctx.storeId)) {
        return res.status(403).json({
            success: false,
            error: 'Cart not available in this context'
        });
    }

    const item = cart.items.id(itemId);
    if (!item) {
        return res.status(404).json({
            success: false,
            error: 'Cart item not found'
        });
    }
    item.quantity = qty;
    await cart.save();

    await cart.populate([
        { path: 'items.product', select: 'name price salePrice image slug variants' },
        { path: 'items.store', select: 'name slug' },
        { path: 'store', select: 'name slug', strictPopulate: false }
    ]);

    const serializedUpdate = serializeCartForResponse(cart);
    const taxRateUpdate = await getTaxRateForCart(cart);
    const summaryUpdate = await computeCartSummary(cart, serializedUpdate, taxRateUpdate);

    res.json({
        success: true,
        data: { ...serializedUpdate, ...summaryUpdate },
        message: 'Cart item updated'
    });
});

/**
 * Remove item from cart. Params: itemId (cart item _id). Only allowed for current context cart.
 */
const removeCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const customerId = req.customer._id;

    const cart = await Cart.findOne({ customer: customerId, 'items._id': itemId });
    if (!cart) {
        return res.status(404).json({
            success: false,
            error: 'Cart or item not found'
        });
    }

    const ctx = getCartContext(req);
    const cartStoreId = cart.store ? String(cart.store._id || cart.store) : null;
    if (cart.scopeType !== ctx.scopeType || (ctx.scopeType === 'store' && cartStoreId !== ctx.storeId)) {
        return res.status(403).json({
            success: false,
            error: 'Cart not available in this context'
        });
    }

    cart.items.pull(itemId);
    await cart.save();

    await cart.populate([
        { path: 'items.product', select: 'name price salePrice image slug variants' },
        { path: 'items.store', select: 'name slug' },
        { path: 'store', select: 'name slug', strictPopulate: false }
    ]);

    const serializedRemove = serializeCartForResponse(cart);
    const taxRateRemove = await getTaxRateForCart(cart);
    const summaryRemove = await computeCartSummary(cart, serializedRemove, taxRateRemove);

    res.json({
        success: true,
        data: { ...serializedRemove, ...summaryRemove },
        message: 'Item removed from cart'
    });
});

/**
 * Clear cart for the current context only.
 */
const clearCart = asyncHandler(async (req, res) => {
    const customerId = req.customer._id;
    const ctx = getCartContext(req);

    const filter = { customer: customerId, scopeType: ctx.scopeType };
    if (ctx.scopeType === 'store') filter.store = ctx.storeId;
    else filter.store = null;

    const cart = await Cart.findOne(filter);
    if (!cart) {
        return res.json({
            success: true,
            data: { items: [] },
            message: 'Cart is already empty'
        });
    }

    cart.items = [];
    await cart.save();

    await cart.populate([{ path: 'store', select: 'name slug', strictPopulate: false }]);
    const serializedClear = serializeCartForResponse(cart);
    const taxRateClear = await getTaxRateForCart(cart);
    const summaryClear = await computeCartSummary(cart, serializedClear, taxRateClear);

    res.json({
        success: true,
        data: { ...serializedClear, ...summaryClear },
        message: 'Cart cleared'
    });
});

/**
 * List the current-context cart only (one cart). For nav badge / dropdown.
 */
const listCarts = asyncHandler(async (req, res) => {
    const customerId = req.customer._id;
    const ctx = getCartContext(req);

    const filter = { customer: customerId, scopeType: ctx.scopeType };
    if (ctx.scopeType === 'store') filter.store = ctx.storeId;
    else filter.store = null;

    const cart = await Cart.findOne(filter)
        .populate('store', 'name slug')
        .populate({ path: 'items.product', select: 'name price salePrice' })
        .populate({ path: 'items.store', select: 'name slug' })
        .lean();

    const summary = cart ? [{
        _id: cart._id,
        scopeType: cart.scopeType,
        store: cart.store,
        itemCount: (cart.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0),
        totalItems: (cart.items || []).length
    }] : [];

    res.json({
        success: true,
        data: summary
    });
});

/**
 * Get cart items for the current context only (one store's cart or marketplace cart). For dropdown.
 */
const getCartItems = asyncHandler(async (req, res) => {
    const customerId = req.customer._id;
    const ctx = getCartContext(req);

    const filter = { customer: customerId, scopeType: ctx.scopeType };
    if (ctx.scopeType === 'store') filter.store = ctx.storeId;
    else filter.store = null;

    const cart = await Cart.findOne(filter)
        .populate({ path: 'items.product', select: 'name price salePrice image slug' })
        .populate({ path: 'items.store', select: 'name slug' });

    const allItems = [];
    if (cart) {
        const serialized = serializeCartForResponse(cart);
        const items = serialized.items || [];
        items.forEach((item) => {
            allItems.push({
                ...item,
                cartScopeType: cart.scopeType,
                cartStoreId: cart.store ? String(cart.store._id || cart.store) : null
            });
        });
    }

    res.json({
        success: true,
        data: { items: allItems }
    });
});

/**
 * Apply promo code to cart. Body: { code }. Phase 3.1.
 */
const applyPromo = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const customerId = req.customer._id;
    const ctx = getCartContext(req);

    if (!code || !String(code).trim()) {
        return res.status(400).json({
            success: false,
            error: 'Promo code is required'
        });
    }
    const codeUpper = String(code).trim().toUpperCase();

    const cart = await getOrCreateCart(customerId, ctx.scopeType, ctx.storeId);
    await cart
        .populate([
            { path: 'items.product', select: 'name price salePrice image slug variants' },
            { path: 'items.store', select: 'name slug' },
            { path: 'store', select: 'name slug', strictPopulate: false }
        ]);

    const serialized = serializeCartForResponse(cart);
    const subtotal = (serialized.items || []).reduce((sum, item) => {
        const price = item.unitPrice != null && item.unitPrice > 0 ? item.unitPrice : 0;
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        return sum + price * qty;
    }, 0);

    const storeId = cart.scopeType === 'store' && cart.store ? (cart.store._id || cart.store) : null;
    const promo = await Promotion.findOne({
        code: codeUpper,
        isActive: true,
        $or: [{ store: null }, { store: storeId }]
    });
    if (!promo) {
        return res.status(400).json({
            success: false,
            error: 'Invalid or expired promo code'
        });
    }
    const now = new Date();
    if (promo.validFrom && now < new Date(promo.validFrom)) {
        return res.status(400).json({ success: false, error: 'Promo code is not yet valid' });
    }
    if (promo.validTo && now > new Date(promo.validTo)) {
        return res.status(400).json({ success: false, error: 'Promo code has expired' });
    }
    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
        return res.status(400).json({ success: false, error: 'Promo code usage limit reached' });
    }
    if (promo.minOrder != null && promo.minOrder > 0 && subtotal < promo.minOrder) {
        return res.status(400).json({
            success: false,
            error: `Minimum order of $${promo.minOrder.toFixed(2)} required for this promo`
        });
    }

    cart.appliedPromoCode = codeUpper;
    await cart.save();

    const taxRate = await getTaxRateForCart(cart);
    const summary = await computeCartSummary(cart, serialized, taxRate);

    res.json({
        success: true,
        data: { ...serialized, ...summary },
        message: 'Promo code applied'
    });
});

/**
 * Remove applied promo code from cart. Phase 3.1.
 */
const removePromo = asyncHandler(async (req, res) => {
    const customerId = req.customer._id;
    const ctx = getCartContext(req);

    const cart = await Cart.findOne({
        customer: customerId,
        scopeType: ctx.scopeType,
        ...(ctx.scopeType === 'store' && ctx.storeId ? { store: ctx.storeId } : { store: null })
    });
    if (!cart) {
        return res.status(404).json({ success: false, error: 'Cart not found' });
    }
    cart.appliedPromoCode = undefined;
    await cart.save();

    await cart
        .populate([
            { path: 'items.product', select: 'name price salePrice image slug variants' },
            { path: 'items.store', select: 'name slug' },
            { path: 'store', select: 'name slug', strictPopulate: false }
        ]);
    const serialized = serializeCartForResponse(cart);
    const taxRate = await getTaxRateForCart(cart);
    const summary = await computeCartSummary(cart, serialized, taxRate);

    res.json({
        success: true,
        data: { ...serialized, ...summary },
        message: 'Promo code removed'
    });
});

module.exports = {
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    listCarts,
    getCartItems,
    applyPromo,
    removePromo
};
