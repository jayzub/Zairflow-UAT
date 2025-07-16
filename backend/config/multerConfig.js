// const multer = require('multer');
// const { FILE_TYPE_MAP } = require('./constants');

// exports.storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const isValid = FILE_TYPE_MAP[file.mimetype];
//         const uploadError = isValid ? null : new Error('Invalid Image Type');
//         cb(uploadError, 'public/uploads');
//     },
//     filename: (req, file, cb) => {
//         const fileName = file.originalname.replace(/\s/g, '-');
//         const extension = FILE_TYPE_MAP[file.mimetype];
//         cb(null, `${fileName}-${Date.now()}.${extension}`);
//     },
// });


const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { FILE_TYPE_MAP } = require('../utils/constants');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
