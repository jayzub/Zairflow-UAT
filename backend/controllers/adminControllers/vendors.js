const { asyncHandler } = require('../../middleware/asyncHandler');
const Vendor = require('../../models/vendor');
const mongoose = require('mongoose');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');

// Admin: Get all vendors for a store
exports.getAllVendors = asyncHandler(async (req, res) => {
    try {
        const vendors = await Vendor.find({ store: req.store._id })
            .sort({ name: 1 });
        
        const data = { 
            vendors,
            pageTitle: 'Vendors'
        };
        
        // Use the helper function to determine response format
        respondWithViewOrJson(req, res, 'admin/vendors/index', data);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        if (req.accepts('html')) {
            res.status(500).render('admin/error', { error: 'Failed to load vendors' });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to load vendors',
                error: error.message
            });
        }
    }
});

// Admin: Render add vendor page
exports.addVendorPage = asyncHandler(async (req, res) => {
    try {
        res.render('admin/vendors/add-vendor', { 
            pageTitle: 'Add Vendor'
        });
    } catch (error) {
        console.error('Error loading add vendor page:', error);
        res.status(500).render('admin/error', { error: 'Failed to load add vendor page' });
    }
});

// Admin: Render edit vendor page
exports.editVendorPage = asyncHandler(async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ 
            _id: req.params.id, 
            store: req.store._id 
        });
        
        if (!vendor) {
            return res.status(404).render('admin/error', { error: 'Vendor not found' });
        }
        
        res.render('admin/vendors/edit-vendor', { 
            vendor,
            pageTitle: 'Edit Vendor'
        });
    } catch (error) {
        console.error('Error loading edit vendor page:', error);
        res.status(500).render('admin/error', { error: 'Failed to load edit vendor page' });
    }
});

// Admin: Create a new vendor
exports.createVendor = asyncHandler(async (req, res) => {
    try {
        const { name, description, email, phone, address, isActive } = req.body;
        
        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Vendor name is required and must be a non-empty string'
            });
        }
        
        // Validate email format if provided
        let emailValue = null;
        if (email && typeof email === 'string' && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }
            
            emailValue = email.trim();
            
            // Check if vendor with same email already exists in this store
            const existingVendor = await Vendor.findOne({
                store: req.store._id,
                email: emailValue
            });
            
            if (existingVendor) {
                return res.status(400).json({
                    success: false,
                    message: 'A vendor with this email already exists in your store'
                });
            }
        }
        
        const vendorData = {
            name: name.trim(),
            description: description || '',
            email: emailValue, // null if not provided
            phone: phone || '',
            address: address || '',
            isActive: isActive !== 'false' && isActive !== false,
            store: req.store._id
        };

        const vendor = new Vendor(vendorData);
        await vendor.save();

        res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            data: vendor
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        console.error('Error details:', {
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue
        });
        
        // Handle duplicate key error (unique index violation)
        if (error.code === 11000) {
            // Check if it's an email duplicate
            if (error.keyPattern && error.keyPattern.email) {
                return res.status(400).json({
                    success: false,
                    message: 'A vendor with this email already exists in your store'
                });
            }
            // Could be other unique constraint violations
            return res.status(400).json({
                success: false,
                message: 'A vendor with these details already exists in your store'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating vendor',
            error: error.message
        });
    }
});

// Admin: Update a vendor
exports.updateVendor = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, email, phone, address, isActive } = req.body;
        
        const vendor = await Vendor.findOne({ 
            _id: id, 
            store: req.store._id 
        });
        
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Validate email if provided
        if (email && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }
            
            // Check if email is being changed and if new email already exists
            if (email.trim() !== vendor.email) {
                const existingVendor = await Vendor.findOne({
                    store: req.store._id,
                    email: email.trim(),
                    _id: { $ne: id }
                });
                
                if (existingVendor) {
                    return res.status(400).json({
                        success: false,
                        message: 'A vendor with this email already exists in your store'
                    });
                }
            }
        }

        const updateData = {
            name: name || vendor.name,
            description: description !== undefined ? description : vendor.description,
            email: email !== undefined ? (email.trim() || null) : vendor.email,
            phone: phone !== undefined ? phone : vendor.phone,
            address: address !== undefined ? address : vendor.address,
            isActive: isActive !== undefined ? (isActive !== 'false' && isActive !== false) : vendor.isActive
        };

        const updatedVendor = await Vendor.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Vendor updated successfully',
            data: updatedVendor
        });
    } catch (error) {
        console.error('Error updating vendor:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A vendor with this email already exists in your store'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating vendor',
            error: error.message
        });
    }
});

// Admin: Delete a vendor
exports.deleteVendor = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        const vendor = await Vendor.findOne({ 
            _id: id, 
            store: req.store._id 
        });
        
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Check if vendor has products
        const BaseProduct = require('../../models/products/baseProduct');
        const productCount = await BaseProduct.countDocuments({ vendor: id });
        
        if (productCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete vendor. There are ${productCount} product(s) associated with this vendor. Please reassign or remove products first.` 
            });
        }

        await Vendor.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Vendor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting vendor',
            error: error.message
        });
    }
});

// Admin: Get vendor statistics
exports.getVendorStats = asyncHandler(async (req, res) => {
    try {
        const storeId = req.store._id;
        const BaseProduct = require('../../models/products/baseProduct');
        
        const stats = await Vendor.aggregate([
            { $match: { store: mongoose.Types.ObjectId(storeId) } },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'vendor',
                    as: 'products'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    phone: 1,
                    productCount: { $size: '$products' },
                    isActive: 1,
                    dateCreated: 1
                }
            },
            { $sort: { name: 1 } }
        ]);
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching vendor stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vendor statistics',
            error: error.message
        });
    }
});
