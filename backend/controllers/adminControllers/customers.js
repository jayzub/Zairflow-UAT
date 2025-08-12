const { asyncHandler } = require('../../middleware/asyncHandler');
const Customer = require('../../models/customer');

// Admin: Get all customers for a store
exports.getAllCustomers = asyncHandler(async (req, res) => {
    try {
        const customers = await Customer.find({ store: req.store._id })
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        res.render('admin/customers', { 
            customers,
            pageTitle: 'Customers'
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).render('admin/error', { error: 'Failed to load customers' });
    }
});

// Admin: Get customer details
exports.getCustomerDetails = asyncHandler(async (req, res) => {
    try {
        const customer = await Customer.findOne({ 
            _id: req.params.id, 
            store: req.store._id 
        }).populate('user', 'firstName lastName email phone');
        
        if (!customer) {
            return res.status(404).render('admin/error', { error: 'Customer not found' });
        }
        
        res.render('admin/customer-details', { 
            customer,
            pageTitle: 'Customer Details'
        });
    } catch (error) {
        console.error('Error loading customer details:', error);
        res.status(500).render('admin/error', { error: 'Failed to load customer details' });
    }
});

// Admin: Create a new customer
exports.createCustomer = asyncHandler(async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address } = req.body;
        
        const customerData = {
            firstName,
            lastName,
            email,
            phone,
            address,
            store: req.store._id
        };

        const customer = new Customer(customerData);
        await customer.save();

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
        const { firstName, lastName, email, phone, address } = req.body;
        
        const customer = await Customer.findOne({ 
            _id: id, 
            store: req.store._id 
        });
        
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const updateData = {
            firstName,
            lastName,
            email,
            phone,
            address
        };

        const updatedCustomer = await Customer.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: updatedCustomer
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
        
        const customer = await Customer.findOne({ 
            _id: id, 
            store: req.store._id 
        });
        
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        await Customer.findByIdAndDelete(id);

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