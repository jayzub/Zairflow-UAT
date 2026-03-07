/**
 * Limits for bulk product CSV import. Used by validators, service, and documented in admin UI.
 */
const MAX_CSV_IMPORT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_CSV_IMPORT_ROWS = 500;

module.exports = {
  MAX_CSV_IMPORT_SIZE_BYTES,
  MAX_CSV_IMPORT_ROWS,
  /** Human-readable max size for UI (e.g. "5MB") */
  MAX_CSV_IMPORT_SIZE_LABEL: '5MB',
};
