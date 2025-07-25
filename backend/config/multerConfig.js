const { v4: uuidv4 } = require('uuid');
const cloudinary = require('./cloudinary'); // Use the pre-configured Cloudinary instance
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { FILE_TYPE_MAP } = require('../utils/constants');

// Configure Multer to use Cloudinary
exports.storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'products', // Folder name in Cloudinary where files will be stored
        allowed_formats: Object.values(FILE_TYPE_MAP), // Allowed file types (e.g., ['jpg', 'png'])
        public_id: (req, file) => {
            const productName = req.body.name.replace(/\s/g, '-') || 'unknown'; // Assuming productId is passed in the request body
            const truncatedId = productName.substring(0, 10); // Take first 10 characters of the product Name
            const uuid = uuidv4().split('-')[0]; // Use first part of UUID for brevity
            return `product-${truncatedId}-${uuid}`; // Unique filename with UUID
        },
    },
});

// Export Multer instance
exports.upload = multer({ storage: exports.storage });
