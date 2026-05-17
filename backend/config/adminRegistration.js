/**
 * Public admin self-registration. Disabled by default for MVP (invite/CLI only).
 * Set ADMIN_REGISTRATION_ENABLED=true to restore sign-up UI and POST /admin/register.
 */
function isAdminRegistrationEnabled() {
  const value = (process.env.ADMIN_REGISTRATION_ENABLED || '').trim().toLowerCase();
  return value === 'true' || value === '1';
}

module.exports = { isAdminRegistrationEnabled };
