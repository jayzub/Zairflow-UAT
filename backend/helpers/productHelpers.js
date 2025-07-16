const BaseProduct = require('../models/products/baseProduct');

exports.getRelatedProducts = async (currentProductId, categoryId) => {
    try {
        if (!categoryId) return [];
        
        const relatedProducts = await BaseProduct.find({
            _id: { $ne: currentProductId },
            category: categoryId,
            status: 'published' // Only get published products
        })
        .select('name price images category') // Select only needed fields
        .populate('category', 'name')
        .limit(8);

        return relatedProducts || [];
    } catch (error) {
        console.error('Error getting related products:', error.message);
        return [];
    }
};
