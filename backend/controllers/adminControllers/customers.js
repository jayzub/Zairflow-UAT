const { asyncHandler } = require('../../middleware/asyncHandler');
const adminCustomersService = require('../../services/admin/adminCustomersService');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');

// Admin: Get all customers for a store
exports.getAllCustomers = asyncHandler(async (req, res) => {
    try {
        const customers = await adminCustomersService.listCustomersForStore(req.store._id);

        const data = { customers, pageTitle: 'Customers' };
        return respondWithViewOrJson(req, res, 'admin/customers', data);
    } catch (error) {
        console.error('Error fetching customers:', error);
        if (req.accepts('html')) {
            return res.status(500).render('admin/error', { error: 'Failed to load customers' });
        }
        return res.status(500).json({ success: false, message: 'Failed to load customers', error: error.message });
    }
});

// Admin: Get customer details
exports.getCustomerDetails = asyncHandler(async (req, res) => {
    try {
        const customer = await adminCustomersService.getCustomerDetails({
            storeId: req.store._id,
            customerId: req.params.id
        });
        
        if (!customer) {
            if (req.accepts('html')) {
                return res.status(404).render('admin/error', { error: 'Customer not found' });
            }
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        
        const data = { customer, pageTitle: 'Customer Details' };
        return respondWithViewOrJson(req, res, 'admin/customer-details', data);
    } catch (error) {
        console.error('Error loading customer details:', error);
        if (req.accepts('html')) {
            return res.status(500).render('admin/error', { error: 'Failed to load customer details' });
        }
        return res.status(500).json({ success: false, message: 'Failed to load customer details', error: error.message });
    }
});

// Admin: Create a new customer
exports.createCustomer = asyncHandler(async (req, res) => {
    try {
        const customer = await adminCustomersService.createCustomer({
            storeId: req.store._id,
            body: req.body
        });

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: customer
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating customer',
            error: error.message
        });
    }
});

// Admin: Update a customer
exports.updateCustomer = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await adminCustomersService.updateCustomer({
            storeId: req.store._id,
            customerId: id,
            body: req.body
        });

        if (!updated.ok && updated.reason === 'not_found') {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: updated.customer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating customer',
            error: error.message
        });
    }
});

// Admin: Delete a customer
exports.deleteCustomer = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await adminCustomersService.deleteCustomer({
            storeId: req.store._id,
            customerId: id
        });

        if (!deleted.ok && deleted.reason === 'not_found') {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting customer',
            error: error.message
        });
    }
}); 