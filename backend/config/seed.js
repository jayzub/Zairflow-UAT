require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/category');
const BaseProduct = require('../models/products/baseProduct');
const Electronics = require('../models/products/electronics');
const Clothing = require('../models/products/clothing');
const Furniture = require('../models/products/furniture');
const Vendor = require('../models/vendor');
const Review = require('../models/reviews/review');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.DB_URL);

const categories = [
    {
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices and gadgets",
        icon: "electronics-icon.jpg",
        color: "#007bff",
        allowedProductTypes: ["Electronics"],
        attributes: [
            {
                name: "warranty",
                type: "string",
                required: true
            },
            {
                name: "powerConsumption",
                type: "string",
                required: false
            }
        ]
    },
    {
        name: "Clothing",
        slug: "clothing",
        description: "Fashion and apparel",
        icon: "clothing-icon.jpg",
        color: "#ff6b6b",
        allowedProductTypes: ["Clothing"],
        attributes: [
            {
                name: "material",
                type: "string",
                required: true
            },
            {
                name: "care",
                type: "array",
                required: true
            }
        ]
    },
    {
        name: "Furniture",
        slug: "furniture",
        description: "Home and office furniture",
        icon: "furniture-icon.jpg",
        color: "#82c91e",
        allowedProductTypes: ["Furniture"],
        attributes: [
            {
                name: "material",
                type: "string",
                required: true
            },
            {
                name: "assembly",
                type: "object",
                required: true
            }
        ]
    }
];

const vendors = [
    {
        name: "Apple Inc.",
        description: "Technology company that designs, develops, and sells consumer electronics",
        email: "contact@apple.com",
        phone: "1-800-275-2273",
        address: "One Apple Park Way, Cupertino, CA 95014",
        isActive: true
    },
    {
        name: "FashionBrand Co.",
        description: "Premium clothing manufacturer",
        email: "support@fashionbrand.com",
        phone: "1-888-555-0123",
        address: "123 Fashion Ave, New York, NY 10001",
        isActive: true
    },
    {
        name: "FurnitureCo",
        description: "Quality furniture manufacturer",
        email: "info@furnitureco.com",
        phone: "1-877-555-0456",
        address: "456 Industrial Pkwy, Chicago, IL 60601",
        isActive: true
    }
];

const users = [
    {
        name: "John Doe",
        email: "john@example.com",
        passwordHash: bcrypt.hashSync('password123', 10),
        phone: "+1-555-0123",
        isAdmin: false,
        street: "123 Main St",
        apartment: "4B",
        zip: "10001",
        city: "New York",
        country: "USA"
    },
    {
        name: "Jane Smith",
        email: "jane@example.com",
        passwordHash: bcrypt.hashSync('password123', 10),
        phone: "+1-555-0124",
        isAdmin: false,
        street: "456 Oak Ave",
        apartment: "2A",
        zip: "90210",
        city: "Los Angeles",
        country: "USA"
    }
];

const sampleReviews = [
    {
        rating: 5,
        title: "Amazing Product!",
        comment: "This exceeded my expectations in every way.",
    },
    {
        rating: 4,
        title: "Good Value",
        comment: "Great product for the price, would recommend.",
    }
];

const products = {
    electronics: [
        {
            name: "MacBook Pro 14-inch",
            description:  "Experience the power of Apple's latest M1 Pro chip...",
            brand: "Apple",
            price: 1999.99,
            images: [{
                url: "https://res.cloudinary.com/dciyc3p3k/image/upload/v1737512596/products/product-Product-0-301e9800.jpg",
                public_id: "products/macbook-pro"
            }],
            specifications: {
                processor: {
                    name: "M1 Pro",
                    cores: 10,
                    speed: "3.2 GHz",
                    architecture: "ARM"
                },
                memory: {
                    ram: 16,
                    ramUnit: "GB",
                    storage: 512,
                    storageUnit: "GB",
                    storageType: "SSD"
                },
                display: {
                    size: 14,
                    resolution: "3024x1964",
                    technology: "Liquid Retina XDR",
                    refreshRate: 120,
                    brightness: 1000,
                    hdr: true
                }
            },
            countInStock: 4,
            color: "Silver",
            colorHex: "#C0C0C0",
            warranty: {
                duration: 12,
                type: "Limited Warranty"
            },
            isFeatured: true,
            tags: ["laptop", "apple", "m1", "professional", "premium"]
        }
    ],
    clothing: [
        {
            name: "Premium Cotton T-Shirt",
            description: "Comfortable everyday wear. Made from 100% organic cotton...",
            brand: "FashionBrand",
            price: 29.99,
            images: [{
                url: "https://res.cloudinary.com/dciyc3p3k/image/upload/v1736746228/products/product-Product-0-ecc127b9.jpg",
                public_id: "products/product-Product-0-a0111f3c"
            },
            {
                url: "https://res.cloudinary.com/dciyc3p3k/image/upload/v1736746304/products/product-Product-0-055197a1.jpg",
                public_id: "products/product-Product-0-a0111f3c"
            },
            {
                url: "https://res.cloudinary.com/dciyc3p3k/image/upload/v1736746290/products/product-Product-0-51d226c8.jpg",
                public_id: "products/product-Product-0-a0111f3c"
            },
        ],
            material: "100% Cotton",
            materialComposition: [
                { material: "Organic Cotton", percentage: 100 }
            ],
            care: ["Machine wash cold", "Tumble dry low"],
            fit: "Regular",
            season: "All-season",
            gender: "unisex",
            countInStock: 11,
            variants: [
                {
                    size: "M",
                    color: "Black",
                    colorHex: "#000080",
                    sku: "TSH-NVY-M"
                },
                {
                    size: "L",
                    color: "Navy Blue",
                    colorHex: "#000080",
                    sku: "TSH-NVY-L"
                }
            ],
            tags: ["t-shirt", "cotton", "casual", "sustainable"]
        }
    ],
    furniture: [
        {
            name: "Modern Sofa",
            description: "Contemporary 3-seater sofa Elegant and comfortable modern sofa...",
            brand: "FurnitureCo",
            price: 899.99,
            images: [{
                url: "https://res.cloudinary.com/dciyc3p3k/image/upload/v1737512611/products/product-Product-0-f462390f.jpg",
                public_id: "products/sofa"
            }],
            countInStock: 10,
            dimensions: {
                length: 200,
                width: 85,
                height: 70,
                unit: "cm"
            },
            weight: {
                value: 45,
                unit: "kg"
            },
            color: "Green",
            colorHex: "#008000",
            materials: [
                {
                    type: "Frame",
                    description: "Solid hardwood"
                },
                {
                    type: "Upholstery",
                    description: "Premium fabric"
                }
            ],
            assembly: {
                required: true,
                estimatedTime: "30 minutes",
                toolsIncluded: true
            },
            style: "Modern",
            roomType: ["Living Room", "Office"],
            warranty: {
                duration: 24,
                coverage: "Frame and springs"
            },
            tags: ["sofa", "modern", "living room", "3-seater"]
        }
    ]
};

const seedDB = async () => {
    try {
        // Clear existing data
        await Category.deleteMany({});
        await BaseProduct.deleteMany({});
        await Vendor.deleteMany({});
        await Review.deleteMany({});
        await User.deleteMany({});

        console.log('Deleted existing categories, products, vendors, and users');

        // Insert users first
        const insertedUsers = await User.insertMany(users);
        console.log('Users inserted');

        // Insert vendors
        const insertedVendors = await Vendor.insertMany(vendors);
        console.log('Vendors inserted');

        // Create a map of vendor names to their IDs
        const vendorMap = {};
        insertedVendors.forEach(vendor => {
            vendorMap[vendor.name] = vendor._id;
        });

        // Insert categories
        const insertedCategories = await Category.insertMany(categories);
        console.log('Categories inserted');

        // Create a map of category names to their IDs
        const categoryMap = {};
        insertedCategories.forEach(category => {
            categoryMap[category.name.toLowerCase()] = category._id;
        });

        // Insert products for each category
        for (const [productType, productList] of Object.entries(products)) {
            let Model;
            let categoryId;
            let vendorId;

            switch (productType) {
                case 'electronics':
                    Model = Electronics;
                    categoryId = categoryMap['electronics'];
                    vendorId = vendorMap['Apple Inc.'];
                    break;
                case 'clothing':
                    Model = Clothing;
                    categoryId = categoryMap['clothing'];
                    vendorId = vendorMap['FashionBrand Co.'];
                    break;
                case 'furniture':
                    Model = Furniture;
                    categoryId = categoryMap['furniture'];
                    vendorId = vendorMap['FurnitureCo'];
                    break;
                default:
                    continue;
            }

            // Add category ID and vendor ID to each product and set image
            const productsWithRefs = productList.map(product => ({
                ...product,
                category: [categoryId],
                vendor: vendorId,
                image: product.images[0] // Set image to the first image in the images array
            }));

            await Model.insertMany(productsWithRefs);
            console.log(`${productType} products inserted`);
        }

        // After inserting products, add reviews
        for (const [productType, productList] of Object.entries(products)) {
            let Model;
            switch (productType) {
                case 'electronics':
                    Model = Electronics;
                    break;
                case 'clothing':
                    Model = Clothing;
                    break;
                case 'furniture':
                    Model = Furniture;
                    break;
                default:
                    continue;
            }

            const insertedProducts = await Model.find();
            
            // Create reviews for each product
            for (const product of insertedProducts) {
                const reviewsToInsert = sampleReviews.map((review, index) => ({
                    ...review,
                    product: product._id,
                    user: insertedUsers[index]._id,
                    dateCreated: new Date()
                }));

                const insertedReviews = await Review.insertMany(reviewsToInsert);
                
                // Update product with reviews
                product.reviews = insertedReviews.map(review => review._id);
                product.numReviews = insertedReviews.length;
                product.rating = insertedReviews.reduce((acc, review) => acc + review.rating, 0) / insertedReviews.length;
                await product.save();
            }
        }

        console.log('Reviews inserted and products updated');
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();
