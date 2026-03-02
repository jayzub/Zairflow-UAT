/**
 * Order confirmation email. Phase 7.2.
 * Sends when SMTP is configured (SMTP_HOST, etc.). No-op otherwise.
 */
const Order = require('../models/order');

const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || process.env.MAIL_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS;
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_FROM || 'noreply@example.com';
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';

function isConfigured() {
    return Boolean(SMTP_HOST && (SMTP_USER ? SMTP_PASS : true));
}

/**
 * Build HTML body for order confirmation (one or more orders).
 */
function buildOrderConfirmationHtml(orders, customerName) {
    const name = customerName || 'Customer';
    let html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmation</title></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #28a745;">Thank you for your order</h2>
  <p>Hi ${escapeHtml(name)},</p>
  <p>We have received your order and will process it shortly.</p>
`;
    for (const order of orders) {
        const orderNumber = order.orderNumber || order._id.toString().slice(-8);
        const total = order.totalPrice != null ? Number(order.totalPrice).toFixed(2) : '0.00';
        const items = order.orderItems || [];
        html += `
  <div style="margin: 24px 0; padding: 16px; border: 1px solid #eee; border-radius: 8px;">
    <p style="margin: 0 0 8px 0;"><strong>Order #${escapeHtml(orderNumber)}</strong></p>
    <p style="margin: 0 0 12px 0; color: #666;">Total: $${total}</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead><tr style="border-bottom: 1px solid #ddd;"><th style="text-align: left; padding: 8px 0;">Item</th><th style="text-align: right;">Qty</th><th style="text-align: right;">Price</th><th style="text-align: right;">Total</th></tr></thead>
      <tbody>
`;
        for (const item of items) {
            const baseName = (item.product && item.product.name) ? item.product.name : 'Product';
            const opts = item.options || {};
            const optsStr = [opts.size, opts.color].filter(Boolean).join(', ');
            const productName = optsStr ? `${baseName} (${optsStr})` : baseName;
            const qty = item.quantity || 1;
            const up = (item.unitPrice != null && item.unitPrice >= 0) ? item.unitPrice : 0;
            const lineTotal = (qty * up).toFixed(2);
            html += `        <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0;">${escapeHtml(productName)}</td><td style="text-align: right;">${qty}</td><td style="text-align: right;">$${up.toFixed(2)}</td><td style="text-align: right;">$${lineTotal}</td></tr>\n`;
        }
        html += `      </tbody>
    </table>
    <p style="margin: 12px 0 0 0; font-size: 13px; color: #666;">Shipping: ${escapeHtml([order.shippingAddress1, order.city, order.zip, order.country].filter(Boolean).join(', '))}</p>
  </div>
`;
    }
    const profileUrl = `${APP_BASE_URL.replace(/\/$/, '')}/profile`;
    html += `
  <p><a href="${profileUrl}" style="color: #007bff;">View your orders</a></p>
  <p style="color: #666; font-size: 13px;">If you have any questions, please contact our support.</p>
</body>
</html>`;
    return html;
}

function escapeHtml(s) {
    if (s == null) return '';
    const str = String(s);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Send order confirmation email to customer. Non-blocking; logs errors.
 * @param {string[]} orderIds - Order IDs (created in placeOrder)
 * @param {string} customerEmail - Customer email
 * @param {string} [customerName] - Customer name
 */
async function sendOrderConfirmationEmail(orderIds, customerEmail, customerName) {
    if (!orderIds || orderIds.length === 0 || !customerEmail || !customerEmail.trim()) {
        return;
    }
    if (!isConfigured()) {
        return;
    }
    let transporter;
    try {
        const nodemailer = require('nodemailer');
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
        });
    } catch (err) {
        console.warn('[orderConfirmationEmail] nodemailer not available:', err.message);
        return;
    }
    try {
        const orders = await Order.find({ _id: { $in: orderIds } })
            .populate({ path: 'orderItems', populate: { path: 'product', select: 'name' } })
            .lean();
        if (orders.length === 0) return;
        const html = buildOrderConfirmationHtml(orders, customerName);
        const firstOrderNumber = orders[0].orderNumber || orders[0]._id.toString().slice(-8);
        const subject = orders.length === 1
            ? `Order confirmation #${firstOrderNumber}`
            : `Order confirmation – ${orders.length} orders`;
        await transporter.sendMail({
            from: MAIL_FROM,
            to: customerEmail.trim(),
            subject,
            html
        });
    } catch (err) {
        console.error('[orderConfirmationEmail] Failed to send:', err.message);
    }
}

module.exports = {
    sendOrderConfirmationEmail,
    isConfigured: isConfigured()
};
