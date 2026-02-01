const userRepository = require('../../repositories/admin/userRepository');

async function findUserByEmail(emailInput) {
  return userRepository.findByEmail(emailInput);
}

async function findUserForLoginByEmail(emailInput) {
  return userRepository.findForLoginByEmail(emailInput);
}

async function createRegisteredUser({ name, email, password, phone, role, position, department, isAdmin }) {
  const emailInput = (email || '').trim();

  return userRepository.createUser({
    name,
    email: emailInput.toLowerCase(),
    password, // virtual -> passwordHash
    phone,
    role: role || 'store_owner',
    position,
    department,
    isAdmin: isAdmin || false,
  });
}

module.exports = {
  findUserByEmail,
  findUserForLoginByEmail,
  createRegisteredUser,
};

