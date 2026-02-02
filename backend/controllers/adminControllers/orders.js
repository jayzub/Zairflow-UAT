const { asyncHandler } = require('../../middleware/asyncHandler');
const adminOrdersService = require('../../services/admin/adminOrdersService');
const { respondWithViewOrJson } = require('../../helpers/respondWithViewOrJson');

// Admin: Get all orders for a store
exports.getAllOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await adminOrdersService.listOrdersForStore(req.store._id);

        const data = { orders, pageTitle: 'Orders' };
        return respondWithViewOrJson(req, res, 'admin/orders', data);
    } catch (error) {
        console.error('Error fetching orders:', error);
        if (req.accepts('html')) {
            return res.status(500).render('admin/error', { error: 'Failed to load orders' });
        }
        return res.status(500).json({ success: false, message: 'Failed to load orders', error: error.message });
    }
});

// Admin: Get order details
exports.getOrderDetails = asyncHandler(async (req, res) => {
    try {
        const order = await adminOrdersService.getOrderDetails({
            storeId: req.store._id,
            orderId: req.params.id
        });
        
        if (!order) {
            if (req.accepts('html')) {
                return res.status(404).render('admin/error', { error: 'Order not found' });
            }
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        const data = { order, pageTitle: 'Order Details' };
        return respondWithViewOrJson(req, res, 'admin/order-details', data);
    } catch (error) {
        console.error('Error loading order details:', error);
        if (req.accepts('html')) {
            return res.status(500).render('admin/error', { error: 'Failed to load order details' });
        }
        return res.status(500).json({ success: false, message: 'Failed to load order details', error: error.message });
    }
});

// Admin: Update order status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await adminOrdersService.updateOrderStatus({
            storeId: req.store._id,
            orderId: id,
            status
        });

        if (!updated.ok && updated.reason === 'not_found') {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: updated.order
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

        const result = await adminOrdersService.processRefund({
            storeId: req.store._id,
            orderId: id,
            refundAmount,
            reason
        });

        if (!result.ok && result.reason === 'not_found') {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!result.ok && result.reason === 'exceeds_total') {
            return res.status(400).json({ 
                success: false, 
                message: 'Refund amount cannot exceed order total' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: result.order
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