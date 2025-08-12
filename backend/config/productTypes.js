/**
 * Centralized Product Type Configuration
 * 
 * To add a new product type:
 * 1. Add it to PRODUCT_TYPES array
 * 2. Create the model file in models/products/
 * 3. Add it to productTypeModelMap in helpers/productHelpers.js
 * 4. Update subscription limits if needed
 */

const PRODUCT_TYPES = {
    CLOTHING: {
        name: 'Clothing',
        displayName: 'Clothing & Apparel',
        description: 'Clothing, shoes, accessories',
        icon: 'fas fa-tshirt',
        color: '#007bff',
        fields: {
            material: { type: 'string', required: false, label: 'Material' },
            materialComposition: { type: 'array', required: false, label: 'Material Composition' },
            care: { type: 'array', required: false, label: 'Care Instructions' },
            fit: { type: 'string', required: false, label: 'Fit Type' },
            season: { type: 'string', required: false, label: 'Season' },
            gender: { 
                type: 'string', 
                required: false, 
                label: 'Gender',
                enum: ['men', 'women', 'unisex', 'kids'],
                options: [
                    { value: 'men', label: 'Men' },
                    { value: 'women', label: 'Women' },
                    { value: 'unisex', label: 'Unisex' },
                    { value: 'kids', label: 'Kids' }
                ]
            },
            variants: { type: 'array', required: false, label: 'Variants (Sizes/Colors)' }
        },
        variantFields: ['size', 'color', 'colorHex', 'sku'],
        subscriptionPlans: ['free', 'basic', 'premium', 'enterprise']
    },
    
    ELECTRONICS: {
        name: 'Electronics',
        displayName: 'Electronics & Gadgets',
        description: 'Computers, phones, gadgets',
        icon: 'fas fa-laptop',
        color: '#28a745',
        fields: {
            modelNumber: { type: 'string', required: false, label: 'Model Number' },
            specifications: { type: 'object', required: false, label: 'Specifications' },
            warranty: { type: 'object', required: false, label: 'Warranty' },
            dimensions: { type: 'object', required: false, label: 'Dimensions' },
            weight: { type: 'object', required: false, label: 'Weight' },
            variants: { type: 'array', required: false, label: 'Variants (Colors/SKUs)' }
        },
        variantFields: ['color', 'colorHex', 'sku'],
        subscriptionPlans: ['basic', 'premium', 'enterprise']
    },
    
    FURNITURE: {
        name: 'Furniture',
        displayName: 'Furniture & Home',
        description: 'Furniture, home decor',
        icon: 'fas fa-couch',
        color: '#ffc107',
        fields: {
            dimensions: { type: 'object', required: false, label: 'Dimensions' },
            weight: { type: 'object', required: false, label: 'Weight' },
            materials: { type: 'array', required: false, label: 'Materials' },
            assembly: { type: 'object', required: false, label: 'Assembly' },
            style: { type: 'string', required: false, label: 'Style' },
            roomType: { type: 'array', required: false, label: 'Room Type' },
            warranty: { type: 'object', required: false, label: 'Warranty' },
            variants: { type: 'array', required: false, label: 'Variants (Colors/SKUs)' }
        },
        variantFields: ['color', 'colorHex', 'sku'],
        subscriptionPlans: ['premium', 'enterprise']
    },
    
    BOOKS: {
        name: 'Books',
        displayName: 'Books & Publications',
        description: 'Books, magazines, digital content',
        icon: 'fas fa-book',
        color: '#dc3545',
        fields: {
            author: { type: 'string', required: false, label: 'Author' },
            publisher: { type: 'string', required: false, label: 'Publisher' },
            isbn: { type: 'string', required: false, label: 'ISBN' },
            language: { type: 'string', required: false, label: 'Language' },
            format: { 
                type: 'string', 
                required: false, 
                label: 'Format',
                enum: ['hardcover', 'paperback', 'ebook', 'audiobook'],
                options: [
                    { value: 'hardcover', label: 'Hardcover' },
                    { value: 'paperback', label: 'Paperback' },
                    { value: 'ebook', label: 'E-Book' },
                    { value: 'audiobook', label: 'Audiobook' }
                ]
            },
            genre: { type: 'array', required: false, label: 'Genre' },
            pages: { type: 'number', required: false, label: 'Pages' },
            publicationDate: { type: 'date', required: false, label: 'Publication Date' },
            variants: { type: 'array', required: false, label: 'Variants (Formats/Languages)' }
        },
        variantFields: ['format', 'language', 'sku'],
        subscriptionPlans: ['free', 'basic', 'premium', 'enterprise']
    }
};

// Helper functions
const getProductTypeNames = () => Object.keys(PRODUCT_TYPES).map(key => PRODUCT_TYPES[key].name);

const getProductTypeByName = (name) => {
    return Object.values(PRODUCT_TYPES).find(type => type.name === name);
};

const getProductTypesForPlan = (plan) => {
    return Object.values(PRODUCT_TYPES).filter(type => 
        type.subscriptionPlans.includes(plan)
    ).map(type => type.name);
};

const getProductTypeFields = (productTypeName) => {
    const productType = getProductTypeByName(productTypeName);
    return productType ? productType.fields : {};
};

const getProductTypeVariantFields = (productTypeName) => {
    const productType = getProductTypeByName(productTypeName);
    return productType ? productType.variantFields : [];
};

const getAllProductTypes = () => {
    return Object.values(PRODUCT_TYPES);
};

const getProductTypeConfig = (productTypeName) => {
    return getProductTypeByName(productTypeName);
};

module.exports = {
    PRODUCT_TYPES,
    getProductTypeNames,
    getProductTypeByName,
    getProductTypesForPlan,
    getProductTypeFields,
    getProductTypeVariantFields,
    getAllProductTypes,
    getProductTypeConfig
}; 