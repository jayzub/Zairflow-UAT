const orderRepository = require('../../repositories/admin/orderRepository');

async function listOrdersForStore(storeId) {
  return orderRepository.listForStoreWithPopulates(storeId);
}

async function getOrderDetails({ storeId, orderId }) {
  return orderRepository.findOneForStoreByIdWithDetails(storeId, orderId);
}

async function updateOrderStatus({ storeId, orderId, status }) {
  const order = await orderRepository.findOneForStoreById(storeId, orderId);
  if (!order) return { ok: false, reason: 'not_found' };

  const updatedOrder = await orderRepository.updateOneForStoreById(storeId, orderId, { status });
  return { ok: true, order: updatedOrder };
}

async function processRefund({ storeId, orderId, refundAmount, reason }) {
  const order = await orderRepository.findOneForStoreById(storeId, orderId);
  if (!order) return { ok: false, reason: 'not_found' };

  if (refundAmount > order.totalAmount) {
    return { ok: false, reason: 'exceeds_total' };
  }

  const updatedOrder = await orderRepository.updateOneForStoreById(storeId, orderId, {
    refundAmount,
    refundReason: reason,
    refundDate: new Date(),
    status: 'refunded',
  });

  return { ok: true, order: updatedOrder };
}

module.exports = {
  listOrdersForStore,
  getOrderDetails,
  updateOrderStatus,
  processRefund,
};

