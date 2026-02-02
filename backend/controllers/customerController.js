const Customer = require('../models/customer');
const Product = require('../models/products/baseProduct');
const Store = require('../models/store');
const CustomerStoreMembership = require('../models/customerStoreMembership');
const { asyncHandler } = require('../middleware/asyncHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function upsertMembership({ customerId, storeId }) {
    if (!customerId || !storeId) return null;
    return CustomerStoreMembership.findOneAndUpdate(
        { customer: customerId, store: storeId },
        { $setOnInsert: { customer: customerId, store: storeId, joinedAt: new Date(), status: 'active' } },
        { upsert: true, new: true }
    );
}

/**
 * Register a new customer
 */
const registerCustomer = asyncHandler(async (req, res) => {
    const { name, email, password, phone, dateOfBirth, gender } = req.body;
    const emailInput = (email || '').trim();
    const storeId = req.store?._id || req.body?.storeId || null;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: new RegExp(`^${emailInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (existingCustomer) {
        // If a store context is present, treat "register" as "join this store" for an existing global customer.
        // We verify password to prevent unauthorized store-joins.
        if (storeId) {
            const isValidPassword = await bcrypt.compare(String(password || ''), existingCustomer.passwordHash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            await upsertMembership({ customerId: existingCustomer._id, storeId });

            const token = jwt.sign(
                {
                    id: existingCustomer._id,
                    email: existingCustomer.email,
                    type: 'customer'
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                success: true,
                data: {
                    customer: {
                        id: existingCustomer._id,
                        name: existingCustomer.name,
                        email: existingCustomer.email,
                        phone: existingCustomer.phone
                    },
                    token
                },
                message: 'Customer joined store successfully'
            });
        }

        return res.status(400).json({
            success: false,
            error: 'Customer with this email already exists'
        });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create customer
    const customer = new Customer({
        name,
        email: emailInput.toLowerCase(),
        passwordHash,
        phone,
        dateOfBirth,
        gender
    });

    await customer.save();

    // If we have store context, create a store membership for this customer
    if (storeId) {
        await upsertMembership({ customerId: customer._id, storeId });
    }

    // Generate JWT token
    const token = jwt.sign(
        { 
            id: customer._id, 
            email: customer.email,
            type: 'customer'
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.status(201).json({
        success: true,
        data: {
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            },
            token
        },
        message: 'Customer registered successfully'
    });
});

/**
 * Customer login
 */
const loginCustomer = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const emailInput = (email || '').trim();
    const storeId = req.store?._id || req.body?.storeId || null;

    // Find customer
    const customer = await Customer.findOne({ email: new RegExp(`^${emailInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (!customer) {
        return res.status(401).json({
            success: false,
            error: 'Invalid email or password'
        });
    }

    // Check if customer is active
    if (!customer.isActive) {
        return res.status(401).json({
            success: false,
            error: 'Account is deactivated'
        });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
    if (!isValidPassword) {
        return res.status(401).json({
            success: false,
            error: 'Invalid email or password'
        });
    }

    // Update last login
    customer.lastLogin = new Date();
    customer.loginHistory.push({
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Keep only last 10 login records
    if (customer.loginHistory.length > 10) {
        customer.loginHistory = customer.loginHistory.slice(-10);
    }

    await customer.save();

    // If logging in with store context, ensure membership exists (auto-join on first login).
    if (storeId) {
        await upsertMembership({ customerId: customer._id, storeId });
    }

    // Generate JWT token
    const token = jwt.sign(
        { 
            id: customer._id, 
            email: customer.email,
            type: 'customer'
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({
        success: true,
        data: {
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                avatar: customer.avatar
            },
            token
        },
        message: 'Login successful'
    });
});

/**
 * Get customer profile
 */
const getCustomerProfile = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.customer._id)
        .select('-passwordHash -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -twoFactorSecret');

    res.json({
        success: true,
        data: customer
    });
});

/**
 * Update customer profile
 */
const updateCustomerProfile = asyncHandler(async (req, res) => {
    const { name, phone, dateOfBirth, gender, preferences } = req.body;

    const customer = await Customer.findById(req.customer._id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    // Update fields
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (dateOfBirth) customer.dateOfBirth = dateOfBirth;
    if (gender) customer.gender = gender;
    if (preferences) customer.preferences = { ...customer.preferences, ...preferences };

    await customer.save();

    res.json({
        success: true,
        data: customer,
        message: 'Profile updated successfully'
    });
});

/**
 * Add address to customer
 */
const addAddress = asyncHandler(async (req, res) => {
    const { type, isDefault, street, apartment, city, state, zipCode, country, phone } = req.body;

    const customer = await Customer.findById(req.customer._id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    // If this is a default address, unset other defaults of the same type
    if (isDefault) {
        customer.addresses.forEach(addr => {
            if (addr.type === type || addr.type === 'both') {
                addr.isDefault = false;
            }
        });
    }

    // Add new address
    customer.addresses.push({
        type,
        isDefault,
        street,
        apartment,
        city,
        state,
        zipCode,
        country,
        phone
    });

    await customer.save();

    res.json({
        success: true,
        data: customer.addresses,
        message: 'Address added successfully'
    });
});

/**
 * Update customer address
 */
const updateAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;
    const updateData = req.body;

    const customer = await Customer.findById(req.customer._id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    const addressIndex = customer.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Address not found'
        });
    }

    // If setting as default, unset other defaults of the same type
    if (updateData.isDefault) {
        customer.addresses.forEach(addr => {
            if ((addr.type === updateData.type || addr.type === 'both') && addr._id.toString() !== addressId) {
                addr.isDefault = false;
            }
        });
    }

    // Update address
    customer.addresses[addressIndex] = { ...customer.addresses[addressIndex].toObject(), ...updateData };

    await customer.save();

    res.json({
        success: true,
        data: customer.addresses,
        message: 'Address updated successfully'
    });
});

/**
 * Remove customer address
 */
const removeAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;

    const customer = await Customer.findById(req.customer._id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    customer.addresses = customer.addresses.filter(addr => addr._id.toString() !== addressId);
    await customer.save();

    res.json({
        success: true,
        data: customer.addresses,
        message: 'Address removed successfully'
    });
});

/**
 * Add product to wishlist
 */
const addToWishlist = asyncHandler(async (req, res) => {
    const { productId, storeId } = req.body;

    const customer = await Customer.findById(req.customer._id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    // Verify product and store exist
    const [product, store] = await Promise.all([
        Product.findById(productId),
        Store.findById(storeId)
    ]);

    if (!product) {
        return res.status(404).json({
            success: false,
            error: 'Product not found'
        });
    }

    if (!store) {
        return res.status(404).json({
            success: false,
            error: 'Store not found'
        });
    }

    await customer.addToWishlist(productId, storeId);

    res.json({
        success: true,
        data: customer.wishlist,
        message: 'Product added to wishlist'
    });
});

/**
 * Remove product from wishlist
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId, storeId } = req.params;

    const customer = await Customer.findById(req.customer._id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    await customer.removeFromWishlist(productId, storeId);

    res.json({
        success: true,
        data: customer.wishlist,
        message: 'Product removed from wishlist'
    });
});

/**
 * Get customer wishlist
 */
const getWishlist = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.customer._id)
        .populate({
            path: 'wishlist.product',
            select: 'name price salePrice image brand'
        })
        .populate({
            path: 'wishlist.store',
            select: 'name slug'
        });

    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    res.json({
        success: true,
        data: customer.wishlist
    });
});

/**
 * Get recently viewed products
 */
const getRecentlyViewed = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.customer._id)
        .populate({
            path: 'recentlyViewed.product',
            select: 'name price salePrice image brand'
        })
        .populate({
            path: 'recentlyViewed.store',
            select: 'name slug'
        });

    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    res.json({
        success: true,
        data: customer.recentlyViewed
    });
});

/**
 * Update customer metrics after order
 */
const updateCustomerMetrics = asyncHandler(async (req, res) => {
    const { orderTotal, storeId, categories } = req.body;

    const customer = await Customer.findById(req.customer._id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }

    await customer.updateMetrics(orderTotal);

    // Update favorite categories
    if (categories && categories.length > 0) {
        categories.forEach(category => {
            if (!customer.metrics.favoriteCategories.includes(category)) {
                customer.metrics.favoriteCategories.push(category);
            }
        });
    }

    // Update favorite stores
    if (storeId) {
        const existingStoreIndex = customer.metrics.favoriteStores.findIndex(
            fav => fav.store.toString() === storeId
        );

        if (existingStoreIndex >= 0) {
            customer.metrics.favoriteStores[existingStoreIndex].orderCount += 1;
            customer.metrics.favoriteStores[existingStoreIndex].totalSpent += orderTotal;
        } else {
            customer.metrics.favoriteStores.push({
                store: storeId,
                orderCount: 1,
                totalSpent: orderTotal
            });
        }
    }

    await customer.save();

    res.json({
        success: true,
        data: customer.metrics,
        message: 'Customer metrics updated'
    });
});

module.exports = {
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    updateCustomerProfile,
    addAddress,
    updateAddress,
    removeAddress,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    getRecentlyViewed,
    updateCustomerMetrics
}; 