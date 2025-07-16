const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    addProduct,
    createProduct,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    getProductCount,
    getFeaturedProducts,
    updateProduct,
    removeProduct,
    deleteProduct,
    editProduct,
    getProductsFilterPage,
    testAjax,
} = require('../controllers/productController');
const { storage } = require('../config/multerConfig');

const upload = multer({ storage });

// Define routes
router.get('/add-product', addProduct);
router.get('/edit/:id', editProduct);
router.post('/', upload.array('images', 5), createProduct);

// Specific routes first
router.get('/test-ajax', testAjax);
router.get('/filter', getProductsFilterPage);
router.get('/get/count', getProductCount);
router.get('/get/featured/:count?', getFeaturedProducts);
router.get('/category/:categoryId', getProductsByCategory);

// General routes last
router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.put('/:id', updateProduct);

router.delete('/:id', removeProduct);
router.delete('/delete/:id', deleteProduct);

module.exports = router;
