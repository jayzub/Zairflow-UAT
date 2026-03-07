/**
 * Admin password reset email. Sends when SMTP is configured; no-op otherwise.
 * Reset link uses APP_BASE_URL so the admin reset page and token are correct.
 */
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
 * Send admin password reset email with link to /admin/auth/reset-password?token=...
 * Non-blocking; logs errors.
 * @param {string} email - Admin email
 * @param {string} resetToken - Plain token (included in URL; do not log)
 * @param {string} [adminName] - Display name for greeting
 */
async function sendAdminPasswordResetEmail(email, resetToken, adminName) {
    if (!email || !email.trim() || !resetToken || !resetToken.trim()) {
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
        console.warn('[adminPasswordResetEmail] nodemailer not available:', err.message);
        return;
    }
    const baseUrl = APP_BASE_URL.replace(/\/$/, '');
    const resetUrl = `${baseUrl}/admin/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
    const name = (adminName || '').trim() || 'Admin';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset your password</title></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Reset your admin password</h2>
  <p>Hi ${escapeHtml(name)},</p>
  <p>We received a request to reset the password for your admin account. Click the link below to set a new password. This link expires in 1 hour.</p>
  <p><a href="${escapeHtml(resetUrl)}" style="color: #007bff;">Reset password</a></p>
  <p style="color: #666; font-size: 13px;">If you didn't request this, you can ignore this email. Your password will not be changed.</p>
</body>
</html>`;
    try {
        await transporter.sendMail({
            from: MAIL_FROM,
            to: email.trim(),
            subject: 'Reset your admin password',
            html
        });
    } catch (err) {
        console.error('[adminPasswordResetEmail] Failed to send:', err.message);
    }
}

module.exports = {
    sendAdminPasswordResetEmail,
    isConfigured
};
