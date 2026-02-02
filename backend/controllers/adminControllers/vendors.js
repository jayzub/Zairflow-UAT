const { asyncHandler } = require('../../middleware/asyncHandler');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');
const adminVendorsService = require('../../services/admin/adminVendorsService');

// Admin: Get all vendors for a store
exports.getAllVendors = asyncHandler(async (req, res) => {
    try {
        const vendors = await adminVendorsService.listVendorsForStore(req.store._id);
        
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
        const vendor = await adminVendorsService.getVendorForEdit({
            storeId: req.store._id,
            vendorId: req.params.id
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
        const result = await adminVendorsService.createVendor({
            storeId: req.store._id,
            body: req.body
        });

        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error creating vendor:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating vendor',
            error: error.message
        });
    }
});

// Admin: Update a vendor
exports.updateVendor = asyncHandler(async (req, res) => {
    try {
        const result = await adminVendorsService.updateVendor({
            storeId: req.store._id,
            vendorId: req.params.id,
            body: req.body
        });

        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Error updating vendor:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating vendor',
            error: error.message
        });
    }
});

// Admin: Delete a vendor
exports.deleteVendor = asyncHandler(async (req, res) => {
    try {
        const result = await adminVendorsService.deleteVendor({
            storeId: req.store._id,
            vendorId: req.params.id
        });

        return res.status(result.status).json(result.payload);
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
        const stats = await adminVendorsService.getVendorStats(req.store._id);
        
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
