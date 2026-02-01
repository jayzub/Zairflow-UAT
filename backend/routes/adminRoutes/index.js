const express = require('express');
const router = express.Router();

// Import all admin route modules
// const authRoutes = require('./auth');
const authPagesRoutes = require('./authPages');
const authApiRoutes = require('./authApi');
const meApiRoutes = require('./meApi');
const pagesRoutes = require('./pages');
const dashboardRoutes = require('./dashboard');
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const vendorsRoutes = require('./vendors');
const customersRoutes = require('./customers');
const ordersRoutes = require('./orders');
const storesRoutes = require('./stores');
const usersRoutes = require('./users');
const productTypesRoutes = require('./productTypes');
const customProductTypesRoutes = require('./customProductTypes');

// Mount all admin route modules
// router.use('/', authRoutes);
router.use('/', authPagesRoutes);
router.use('/', authApiRoutes);
router.use('/', meApiRoutes);
router.use('/', pagesRoutes);
router.use('/', dashboardRoutes);
router.use('/', productsRoutes);
router.use('/', categoriesRoutes);
router.use('/', vendorsRoutes);
router.use('/', customersRoutes);
router.use('/', ordersRoutes);
router.use('/', storesRoutes);
router.use('/', usersRoutes);
router.use('/', productTypesRoutes);
router.use('/custom-product-types', customProductTypesRoutes);

module.exports = router; 