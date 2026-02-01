// Canonical Swagger spec exporter.
// We keep the `require('./swagger')` import stable (used by `backend/app.js`),
// but centralize the spec composition in `backend/swagger/config.js`.
module.exports = require('./swagger/config');