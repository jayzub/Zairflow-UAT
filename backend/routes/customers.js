const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const cartController = require('../controllers/cartController');
const { requireCustomerAuth } = require('../middleware/jwt');
const { extractStoreOptional } = require('../middleware/storeIsolation');

// Resolve store context when explicitly provided (subdomain/header/query/path).
// This enables per-store customer memberships while keeping marketplace/platform routes working.
router.use(extractStoreOptional);

router.post('/register', customerController.registerCustomer);
router.post('/login', customerController.loginCustomer);

// Sync session cookie from Bearer token (e.g. localStorage) so server-rendered pages show customer name
router.get('/session', customerController.syncCustomerSession);

// Clear customerToken cookie (call before redirecting to sign-in)
router.get('/logout', customerController.logoutCustomer);

router.get('/profile', requireCustomerAuth, customerController.getCustomerProfile);
router.put('/profile', requireCustomerAuth, customerController.updateCustomerProfile);

router.post('/addresses', requireCustomerAuth, customerController.addAddress);
router.put('/addresses/:addressId', requireCustomerAuth, customerController.updateAddress);
router.delete('/addresses/:addressId', requireCustomerAuth, customerController.removeAddress);

router.get('/wishlist', requireCustomerAuth, customerController.getWishlist);
router.post('/wishlist', requireCustomerAuth, customerController.addToWishlist);
router.delete('/wishlist/:productId/:storeId', requireCustomerAuth, customerController.removeFromWishlist);

router.get('/recently-viewed', requireCustomerAuth, customerController.getRecentlyViewed);

router.post('/metrics', requireCustomerAuth, customerController.updateCustomerMetrics);

// Cart (store cart = one per store; marketplace cart = one per customer)
router.get('/cart', requireCustomerAuth, cartController.getCart);
router.get('/cart/items', requireCustomerAuth, cartController.getCartItems);
router.get('/carts', requireCustomerAuth, cartController.listCarts);
router.post('/cart/items', requireCustomerAuth, cartController.addCartItem);
router.patch('/cart/items/:itemId', requireCustomerAuth, cartController.updateCartItem);
router.delete('/cart/items/:itemId', requireCustomerAuth, cartController.removeCartItem);
router.delete('/cart', requireCustomerAuth, cartController.clearCart);

module.exports = router;
