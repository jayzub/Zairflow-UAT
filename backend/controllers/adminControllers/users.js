// Backwards-compatible barrel: routes can keep requiring this file.
module.exports = {
  ...require('./adminAuthController'),
  ...require('./adminMeController'),
  ...require('./adminUsersController'),
};