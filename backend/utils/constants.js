// Allowed MIME types for image uploads
exports.FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
};

// Pagination and sorting defaults
exports.DEFAULT_LIMIT = 10;
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_SORT = 'dateCreated';
exports.DEFAULT_ORDER = -1; // -1 for desc, 1 for asc
