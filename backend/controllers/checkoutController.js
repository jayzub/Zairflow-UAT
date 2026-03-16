const mongoose = require('mongoose');
const Cart = require('../models/cart');
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Product = require('../models/products/baseProduct');
const Store = require('../models/store');
const { findVariantByOptions, findVariantById, getAvailableStockForItem, getEffectivePrice, parsePrice } = require('../helpers/variantHelpers');
const Promotion = require('../models/promotion');
const Customer = require('../models/customer');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/asyncHandler');

const DEFAULT_TAX_RATE = typeof process.env.DEFAULT_TAX_RATE !== 'undefined'
    ? Math.max(0, Math.min(100, parseFloat(process.env.DEFAULT_TAX_RATE) || 0))
    : 0;

/**
 * Get tax rate (0–100) for a store. Uses store.settings.taxRate or default.
 */
async function getTaxRateForStore(storeId) {
    if (!storeId) return DEFAULT_TAX_RATE;
    const store = await Store.findById(storeId).select('settings.taxRate').lean();
    const rate = store && store.settings && (store.settings.taxRate != null)
        ? Number(store.settings.taxRate)
        : DEFAULT_TAX_RATE;
    return Math.max(0, Math.min(100, rate));
}

/**
 * Compute promo discount amount (same logic as cart controller).
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
 * Cart context from request (store or marketplace).
 */
function getCartContext(req) {
    if (req.store && req.store._id) {
        return { scopeType: 'store', storeId: String(req.store._id) };
    }
    return { scopeType: 'marketplace', storeId: null };
}

/**
 * Load cart for customer + scope (no create).
 * Product is populated without select so discriminator fields (e.g. variants) are always present;
 * otherwise variant products can get base-model-only data and fail availability checks.
 */
async function getCartForCheckout(customerId, scopeType, storeId = null) {
    const filter = { customer: customerId, scopeType };
    if (scopeType === 'store') {
        if (!storeId) return null;
        filter.store = storeId;
    } else {
        filter.store = null;
    }
    return Cart.findOne(filter)
        .populate([{ path: 'items.product' }, { path: 'items.store', select: '_id' }]);
}

/**
 * Generate unique order number.
 */
async function generateOrderNumber() {
    const candidate = 'ORD-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const exists = await Order.exists({ orderNumber: candidate });
    return exists ? generateOrderNumber() : candidate;
}

/**
 * Default shipping methods (can later be store-specific or from config).
 */
const DEFAULT_SHIPPING_METHODS = [
    { id: 'free', name: 'Free Shipping', price: 0, estimatedDays: '5-7 business days' },
    { id: 'standard', name: 'Standard Shipping', price: 10, estimatedDays: '3-5 business days' },
    { id: 'express', name: 'Express Shipping', price: 20, estimatedDays: '1-2 business days' }
];

/**
 * Get available shipping methods for checkout.
 * Query: scopeType, storeId (when store). Returns list of { id, name, price, estimatedDays }.
 */
const getShippingMethods = asyncHandler(async (req, res) => {
    const scopeType = req.query.scopeType != null ? req.query.scopeType : getCartContext(req).scopeType;
    const storeId = req.query.storeId != null ? req.query.storeId : getCartContext(req).storeId;
    const methods = DEFAULT_SHIPPING_METHODS.map(m => ({ ...m }));
    res.json({
        success: true,
        data: { methods }
    });
});

/**
 * Get shipping address from body or customer default.
 */
function getShippingAddress(body, customer) {
    if (body.shippingAddress1 && body.city && body.zip && body.country && body.phone) {
        return {
            shippingAddress1: String(body.shippingAddress1),
            shippingAddress2: body.shippingAddress2 ? String(body.shippingAddress2) : '',
            city: String(body.city),
            zip: String(body.zip),
            country: String(body.country),
            phone: String(body.phone)
        };
    }
    if (!customer.addresses || customer.addresses.length === 0) {
        return null;
    }
    const addr = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
    const line1 = [addr.street, addr.apartment].filter(Boolean).join(', ');
    return {
        shippingAddress1: line1,
        shippingAddress2: '',
        city: addr.city,
        zip: addr.zipCode,
        country: addr.country || 'US',
        phone: addr.phone || customer.phone || ''
    };
}

/**
 * Place order from current cart.
 * Body: scopeType, storeId (when scope=store), optional shipping (shippingAddress1, shippingAddress2, city, zip, country, phone), optional paymentMethod.
 * Creates one order per store; uses customer default address if shipping not in body; decrements stock; clears cart.
 */
const placeOrder = asyncHandler(async (req, res) => {
    const customerId = req.customer._id;
    const ctx = getCartContext(req);
    const scopeType = req.body.scopeType != null ? req.body.scopeType : ctx.scopeType;
    const storeId = req.body.storeId != null ? req.body.storeId : ctx.storeId;

    const cart = await getCartForCheckout(customerId, scopeType, storeId);
    if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Cart is empty'
        });
    }

    const customer = await Customer.findById(customerId).select('email name phone addresses').lean();
    if (!customer) {
        return res.status(401).json({ success: false, error: 'Customer not found' });
    }

    const shipping = getShippingAddress(req.body, customer);
    if (!shipping || !shipping.phone) {
        return res.status(400).json({
            success: false,
            error: 'Shipping address required. Add an address in your profile or provide shippingAddress1, city, zip, country, and phone.'
        });
    }

    const paymentMethodId = req.body.paymentMethodId || null;
    const paymentMethod = paymentMethodId ? 'card' : (req.body.paymentMethod || 'cod');
    const shippingCost = typeof req.body.shippingCost === 'number' ? req.body.shippingCost : (parseFloat(req.body.shippingCost) || 0);
    const shippingMethodId = req.body.shippingMethodId || 'free';

    // Phase 8.1: Re-check inventory before placing order (use variantId when present for consistency with order items and deduction)
    const unavailableItems = [];
    for (const item of cart.items) {
        const product = item.product;
        if (!product) continue;
        const available = getAvailableStockForItem(product, {
            variantId: item.variantId || null,
            options: item.options || {}
        });
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        if (qty > available) {
            unavailableItems.push({
                itemId: item._id,
                productName: product.name || 'Product',
                requested: qty,
                available
            });
        }
    }
    if (unavailableItems.length > 0) {
        return res.status(409).json({
            success: false,
            error: 'Some items are no longer available. Please update your cart.',
            code: 'OUT_OF_STOCK',
            unavailableItems
        });
    }

    // Phase 8.2: We use the cart's stored unitPrice when creating the order (prices locked at cart). No re-check here to avoid false positives from float/schema differences.

    // Group cart items by store
    const byStore = new Map();
    for (const item of cart.items) {
        const sid = item.store && (item.store._id || item.store);
        const storeKey = sid ? String(sid) : null;
        if (!storeKey) continue;
        if (!byStore.has(storeKey)) byStore.set(storeKey, []);
        byStore.get(storeKey).push(item);
    }

    // Total cart subtotal and promo discount (for allocating per store)
    let totalCartSubtotal = 0;
    for (const [, items] of byStore) {
        for (const item of items) {
            const product = item.product;
            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
            const unitPrice = item.unitPrice != null && item.unitPrice > 0
                ? item.unitPrice
                : getEffectivePrice(product, { variantId: item.variantId || null, options: item.options || {} });
            totalCartSubtotal += unitPrice * qty;
        }
    }
    let totalPromoDiscount = 0;
    const code = (cart.appliedPromoCode || '').trim().toUpperCase();
    if (code && totalCartSubtotal > 0) {
        const storeIdForPromo = cart.scopeType === 'store' && cart.store ? (cart.store._id || cart.store) : null;
        const promo = await Promotion.findOne({
            code,
            isActive: true,
            $or: [{ store: null }, { store: storeIdForPromo }]
        }).lean();
        const now = new Date();
        const promoValid = promo &&
            (!promo.validFrom || now >= new Date(promo.validFrom)) &&
            (!promo.validTo || now <= new Date(promo.validTo)) &&
            (promo.usageLimit == null || promo.usedCount < promo.usageLimit) &&
            (promo.minOrder == null || promo.minOrder <= 0 || totalCartSubtotal >= promo.minOrder);
        if (!promoValid) {
            // Phase 8.5: Invalid or expired promo on place-order; clear and tell frontend
            cart.appliedPromoCode = undefined;
            await cart.save();
            return res.status(400).json({
                success: false,
                error: 'Promo code expired or invalid. It has been removed from your cart.',
                code: 'PROMO_INVALID',
                promoRemoved: true
            });
        }
        totalPromoDiscount = computePromoDiscount(promo, totalCartSubtotal);
    }

    const orderIds = [];
    const ordersCreated = [];

    for (const [storeIdKey, items] of byStore) {
        const orderNumber = await generateOrderNumber();
        const orderItemIds = [];
        let subtotal = 0;

        for (const item of items) {
            const product = item.product;
            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
            const unitPrice = item.unitPrice != null && item.unitPrice > 0
                ? item.unitPrice
                : getEffectivePrice(product, { variantId: item.variantId || null, options: item.options || {} });
            const lineTotal = unitPrice * qty;
            subtotal += lineTotal;

            const orderItem = await OrderItem.create({
                product: item.product._id || item.product,
                quantity: qty,
                unitPrice,
                variantId: item.variantId || null,
                options: item.options || {}
            });
            orderItemIds.push(orderItem._id);

            // Inventory deduction (6.3) — variant-level when applicable
            if (product) {
                const variants = product.variants;
                const hasVariants = variants && Array.isArray(variants) && variants.length > 0;
                let variantToDeduct = null;
                // Use discriminator model (HealthBeauty, Clothing, etc.) for variant updates; base Product schema has no variants path
                const ProductModel = (product.constructor && product.constructor.modelName) ? product.constructor : Product;

                if (hasVariants) {
                    if (item.variantId) {
                        variantToDeduct = findVariantById(product, item.variantId);
                    }
                    if (!variantToDeduct) {
                        const res = findVariantByOptions(product, item.options || {});
                        variantToDeduct = res ? res.variant : null;
                    }
                }

                if (variantToDeduct) {
                    if (variantToDeduct._id) {
                        await ProductModel.findByIdAndUpdate(product._id, {
                            $inc: { 'variants.$[elem].countInStock': -qty }
                        }, {
                            arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(variantToDeduct._id) }]
                        });
                    } else {
                        const idx = variants.findIndex((v) => v === variantToDeduct);
                        if (idx >= 0) {
                            await ProductModel.findByIdAndUpdate(product._id, {
                                $inc: { [`variants.${idx}.countInStock`]: -qty }
                            });
                        }
                    }
                } else {
                    await Product.findByIdAndUpdate(product._id, { $inc: { countInStock: -qty } });
                }
            }
        }

        const storeDiscount = totalCartSubtotal > 0 ? (totalPromoDiscount * (subtotal / totalCartSubtotal)) : 0;
        const subtotalAfterDiscount = Math.max(0, subtotal - storeDiscount);
        const taxRate = await getTaxRateForStore(storeIdKey);
        const tax = Math.round(subtotalAfterDiscount * (taxRate / 100) * 100) / 100;
        const orderTotal = Math.round((subtotalAfterDiscount + tax + shippingCost) * 100) / 100;

        // Payment semantics: only mark 'paid' when money is received. COD = paid at placement; card = pending until Stripe charge is implemented (Phase 6.2).
        const paymentStatus = paymentMethod === 'cod' ? 'paid' : 'pending';

        const order = await Order.create({
            store: storeIdKey,
            orderNumber,
            orderItems: orderItemIds,
            shippingAddress1: shipping.shippingAddress1,
            shippingAddress2: shipping.shippingAddress2,
            city: shipping.city,
            zip: shipping.zip,
            country: shipping.country,
            phone: shipping.phone,
            status: 'confirmed',
            totalPrice: orderTotal,
            subtotal,
            tax,
            shipping: shippingCost,
            discount: Math.round(storeDiscount * 100) / 100,
            customer: customerId,
            customerEmail: customer.email,
            customerName: customer.name || customer.email,
            paymentStatus,
            paymentMethod,
            stripePaymentMethodId: paymentMethodId || undefined
        });
        orderIds.push(order._id.toString());
        ordersCreated.push(order);
    }

    // Clear cart (6.4)
    cart.items = [];
    await cart.save();

    const firstOrderId = orderIds[0];
    const confirmationUrl = '/orders/confirmation/' + firstOrderId;

    // Order confirmation email (Phase 7.2); non-blocking
    const { sendOrderConfirmationEmail } = require('../services/orderConfirmationEmail');
    sendOrderConfirmationEmail(orderIds, customer.email, customer.name).catch(() => {});

    res.status(201).json({
        success: true,
        data: {
            orderIds,
            confirmationUrl
        },
        message: 'Order placed successfully'
    });
});

module.exports = {
    getShippingMethods,
    placeOrder
};
