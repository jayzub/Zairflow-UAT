const express = require('express');
const router = express.Router();

// Import all admin route modules
// const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const customersRoutes = require('./customers');
const ordersRoutes = require('./orders');
const storesRoutes = require('./stores');
const usersRoutes = require('./users');
const productTypesRoutes = require('./productTypes');

// Mount all admin route modules
// router.use('/', authRoutes);
router.use('/', dashboardRoutes);
router.use('/', productsRoutes);
router.use('/', categoriesRoutes);
router.use('/', customersRoutes);
router.use('/', ordersRoutes);
router.use('/', storesRoutes);
router.use('/', usersRoutes);
router.use('/', productTypesRoutes);

module.exports = router; 