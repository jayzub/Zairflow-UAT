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
    },

    FOOD: {
        name: 'Food',
        displayName: 'Food & Beverages',
        description: 'Food items, beverages, and consumables',
        icon: 'fas fa-utensils',
        color: '#fd7e14',
        fields: {
            brand: { type: 'string', required: false, label: 'Brand' },
            ingredients: { type: 'array', required: false, label: 'Ingredients' },
            nutritionalInfo: { type: 'object', required: false, label: 'Nutritional Information' },
            expiryDate: { type: 'date', required: false, label: 'Expiry Date' },
            allergens: { type: 'array', required: false, label: 'Allergens' },
            variants: { type: 'array', required: false, label: 'Variants (Flavors/Sizes)' }
        },
        variantFields: ['flavor', 'size', 'sku'],
        subscriptionPlans: ['basic', 'premium', 'enterprise']
    },
    
    SPORTS: {
        name: 'Sports',
        displayName: 'Sports & Outdoors',
        description: 'Sports equipment and outdoor gear',
        icon: 'fas fa-running',
        color: '#20c997',
        fields: {
            sport: { type: 'string', required: false, label: 'Sport Type' },
            skillLevel: { 
                type: 'string', 
                required: false, 
                label: 'Skill Level',
                enum: ['beginner', 'intermediate', 'advanced', 'professional'],
                options: [
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                    { value: 'professional', label: 'Professional' }
                ]
            },
            material: { type: 'string', required: false, label: 'Material' },
            weight: { type: 'object', required: false, label: 'Weight' },
            variants: { type: 'array', required: false, label: 'Variants (Sizes/Colors)' }
        },
        variantFields: ['size', 'color', 'colorHex', 'sku'],
        subscriptionPlans: ['basic', 'premium', 'enterprise']
    },
    
    HOME_GARDEN: {
        name: 'HomeGarden',
        displayName: 'Home & Garden',
        description: 'Home improvement and garden supplies',
        icon: 'fas fa-home',
        color: '#28a745',
        fields: {
            room: { type: 'string', required: false, label: 'Room Type' },
            material: { type: 'string', required: false, label: 'Material' },
            dimensions: { type: 'object', required: false, label: 'Dimensions' },
            variants: { type: 'array', required: false, label: 'Variants (Colors/Sizes)' }
        },
        variantFields: ['color', 'size', 'sku'],
        subscriptionPlans: ['basic', 'premium', 'enterprise']
    },

    HEALTH_BEAUTY: {
        name: 'HealthBeauty',
        displayName: 'Health & Beauty',
        description: 'Health, beauty, and personal care products',
        icon: 'fas fa-spa',
        color: '#e83e8c',
        fields: {
            brand: { type: 'string', required: false, label: 'Brand' },
            skinType: { 
                type: 'string', 
                required: false, 
                label: 'Skin Type',
                enum: ['normal', 'dry', 'oily', 'combination', 'sensitive'],
                options: [
                    { value: 'normal', label: 'Normal' },
                    { value: 'dry', label: 'Dry' },
                    { value: 'oily', label: 'Oily' },
                    { value: 'combination', label: 'Combination' },
                    { value: 'sensitive', label: 'Sensitive' }
                ]
            },
            ingredients: { type: 'array', required: false, label: 'Ingredients' },
            volume: { type: 'object', required: false, label: 'Volume' },
            expiryDate: { type: 'date', required: false, label: 'Expiry Date' },
            variants: { type: 'array', required: false, label: 'Variants (Sizes/Colors)' }
        },
        variantFields: ['size', 'color', 'colorHex', 'sku'],
        subscriptionPlans: ['basic', 'premium', 'enterprise']
    },
    
    
}

// Helper functions
const getProductTypeNames = () => Object.keys(PRODUCT_TYPES).map(key => PRODUCT_TYPES[key].name);

// Validation function to ensure all product types have required properties
const validateProductTypeConfig = () => {
    const requiredProps = ['name', 'displayName', 'description', 'icon', 'color', 'fields', 'variantFields', 'subscriptionPlans'];
    const errors = [];
    
    Object.entries(PRODUCT_TYPES).forEach(([key, type]) => {
        requiredProps.forEach(prop => {
            if (!type[prop]) {
                errors.push(`Product type ${key} is missing required property: ${prop}`);
            }
        });
        
        // Check if fields is an object
        if (type.fields && typeof type.fields !== 'object') {
            errors.push(`Product type ${key} has invalid fields property (should be an object)`);
        }
        
        // Check if variantFields is an array
        if (type.variantFields && !Array.isArray(type.variantFields)) {
            errors.push(`Product type ${key} has invalid variantFields property (should be an array)`);
        }
        
        // Check if subscriptionPlans is an array
        if (type.subscriptionPlans && !Array.isArray(type.subscriptionPlans)) {
            errors.push(`Product type ${key} has invalid subscriptionPlans property (should be an array)`);
        }
    });
    
    if (errors.length > 0) {
        console.error('Product type configuration validation errors:', errors);
        throw new Error(`Product type configuration validation failed: ${errors.join(', ')}`);
    }
    
    console.log('Product type configuration validation passed');
};

// Run validation when module is loaded
validateProductTypeConfig();

const getProductTypeByName = (name) => {
    return Object.values(PRODUCT_TYPES).find(type => type.name === name);
};

const getProductTypesForPlan = (plan) => {
    if (!plan) {
        console.warn('getProductTypesForPlan called with undefined/null plan, returning all product types');
        return Object.values(PRODUCT_TYPES).map(type => type.name);
    }
    
    return Object.values(PRODUCT_TYPES).filter(type => {
        // Defensive check: ensure type has subscriptionPlans property
        if (!type.subscriptionPlans || !Array.isArray(type.subscriptionPlans)) {
            console.warn(`Product type ${type.name} is missing subscriptionPlans property`);
            return false;
        }
        return type.subscriptionPlans.includes(plan);
    }).map(type => type.name);
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