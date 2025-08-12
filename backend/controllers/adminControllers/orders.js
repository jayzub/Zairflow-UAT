const { asyncHandler } = require('../../middleware/asyncHandler');
const Order = require('../../models/order');

// Admin: Get all orders for a store
exports.getAllOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find({ store: req.store._id })
            .populate('customer', 'firstName lastName email')
            .populate('products.product', 'name price image')
            .sort({ createdAt: -1 });
        
        res.render('admin/orders', { 
            orders,
            pageTitle: 'Orders'
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).render('admin/error', { error: 'Failed to load orders' });
    }
});

// Admin: Get order details
exports.getOrderDetails = asyncHandler(async (req, res) => {
    try {
        const order = await Order.findOne({ 
            _id: req.params.id, 
            store: req.store._id 
        })
        .populate('customer', 'firstName lastName email phone address')
        .populate('products.product', 'name price image description');
        
        if (!order) {
            return res.status(404).render('admin/error', { error: 'Order not found' });
        }
        
        res.render('admin/order-details', { 
            order,
            pageTitle: 'Order Details'
        });
    } catch (error) {
        console.error('Error loading order details:', error);
        res.status(500).render('admin/error', { error: 'Failed to load order details' });
    }
});

// Admin: Update order status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const order = await Order.findOne({ 
            _id: id, 
            store: req.store._id 
        });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
});

// Admin: Process refund
exports.processRefund = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { refundAmount, reason } = req.body;
        
        const order = await Order.findOne({ 
            _id: id, 
            store: req.store._id 
        });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (refundAmount > order.totalAmount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Refund amount cannot exceed order total' 
            });
        }

        // Update order with refund information
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            {
                refundAmount,
                refundReason: reason,
                refundDate: new Date(),
                status: 'refunded'
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing refund',
            error: error.message
        });
    }
});

// Admin: Get refund page
exports.getRefundPage = asyncHandler(async (req, res) => {
    try {
        res.render('admin/refund', { 
            pageTitle: 'Refund Management'
        });
    } catch (error) {
        console.error('Error loading refund page:', error);
        res.status(500).render('admin/error', { error: 'Failed to load refund page' });
    }
}); 