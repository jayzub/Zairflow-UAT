/**
 * Customer-facing server-rendered pages (Pug).
 */

const Category = require('../models/category');
const BaseProduct = require('../models/products/baseProduct');
const Customer = require('../models/customer');
const Order = require('../models/order');
const Review = require('../models/review');
const Store = require('../models/store');
const { asyncHandler } = require('../middleware/asyncHandler');

// Map order status to UI badge (ProfileOrderTable)
function orderStatusToBadge(status, paymentStatus) {
  const statusMap = {
    shipped: { label: 'Shipped', type: 'badge-phoenix-success', icon: 'check' },
    delivered: { label: 'Fulfilled', type: 'badge-phoenix-success', icon: 'check' },
    confirmed: { label: 'Ready to pickup', type: 'badge-phoenix-info', icon: 'info' },
    processing: { label: 'Partially fulfilled', type: 'badge-phoenix-warning', icon: 'clock' },
    pending: { label: 'Unfulfilled', type: 'badge-phoenix-danger', icon: 'check' },
    cancelled: { label: 'Canceled', type: 'badge-phoenix-secondary', icon: 'x' },
    refunded: { label: 'Refunded', type: 'badge-phoenix-secondary', icon: 'x' },
  };
  return statusMap[status] || { label: status || 'Pending', type: 'badge-phoenix-secondary', icon: 'clock' };
}

function formatOrderTableRow(order) {
  const status = order.status || 'pending';
  const payment_status = orderStatusToBadge(status, order.paymentStatus);
  const date = order.dateOrdered
    ? new Date(order.dateOrdered).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  return {
    _id: order._id,
    order: order.orderNumber || order._id.toString().slice(-6),
    active: !['cancelled', 'refunded'].includes(status),
    total: order.totalPrice != null ? Number(order.totalPrice) : 0,
    payment_status,
    delivery_type: order.paymentMethod || 'Standard shipping',
    date,
  };
}

function formatReviewTableRow(review) {
  const productName = review.product && (review.product.name || review.product.title) ? review.product.name || review.product.title : 'Product';
  const time = review.dateCreated
    ? new Date(review.dateCreated).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Just now';
  return {
    product: productName,
    rating: review.rating || 0,
    review: review.comment || review.title || '',
    status: { title: 'Approved', badge: 'success', icon: 'check' },
    time,
  };
}

// Short month names for PersonalInfo date dropdown
const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Render the customer e-commerce landing homepage.
 *
 * Views root is configured in `backend/app.js` as:
 *   src/pug/apps/e-commerce
 * So we render `landing/homepage.pug` as `landing/homepage`.
 */
const renderCustomerHomepage = asyncHandler(async (req, res) => {
  const store = req.store; // required by route middleware

  const [categoriesRaw, topDealsRaw] = await Promise.all([
    Category.find({
      store: store._id,
      isActive: true,
    })
      .sort({ displayOrder: 1, name: 1 })
      .select('name slug icon color image displayOrder')
      .lean(),
    BaseProduct.find({
      store: store._id,
      isActive: true,
      salePrice: { $exists: true, $gt: 0 },
    })
      .sort({ dateCreated: -1, _id: 1 })
      .limit(12)
      .select('name image price salePrice rating numReviews countInStock')
      .lean(),
  ]);

  // Normalize product shape for `src/pug/mixins/e-commerce/homepage/common.pug`
  const topDeals = (topDealsRaw || []).map((p) => {
    const price = p.price?.toString ? p.price.toString() : p.price;
    const salePrice = p.salePrice?.toString ? p.salePrice.toString() : p.salePrice;
    const star = typeof p.rating === 'number' ? Math.max(0, Math.min(5, Math.round(p.rating))) : undefined;
    const rated = typeof p.numReviews === 'number' ? p.numReviews : undefined;

    return {
      _id: p._id,
      name: p.name,
      image: p.image?.url || null,
      price,
      salePrice,
      star,
      rated,
      inStock: (p.countInStock || 0) > 0,
    };
  });

  // Only show a reasonable number of categories in the homepage scroller
  const categories = (categoriesRaw || []).slice(0, 12);

  return res.render('landing/homepage', {
    store,
    categories,
    topDeals,
    isCustomerStorefront: true,
  });
});

/**
 * Render the customer profile page (landing/profile.pug).
 * Requires customer auth. Optionally uses store context for breadcrumb/links.
 */
const renderCustomerProfile = asyncHandler(async (req, res) => {
  const customer = req.customer; // set by requireCustomerAuth
  const store = req.store || null;

  const [ordersRaw, reviewsRaw, customerWithWishlist] = await Promise.all([
    Order.find({ customer: customer._id })
      .sort({ dateOrdered: -1 })
      .limit(50)
      .lean(),
    Review.find({ customer: customer._id })
      .populate('product', 'name')
      .sort({ dateCreated: -1 })
      .limit(50)
      .lean(),
    Customer.findById(customer._id)
      .populate({ path: 'wishlist.product', select: 'name image price salePrice' })
      .populate({ path: 'wishlist.store', select: 'name slug' })
      .lean(),
  ]);

  const orderTableData = (ordersRaw || []).map(formatOrderTableRow);
  const customerRatingsTableData = (reviewsRaw || []).map(formatReviewTableRow);
  const ordersCount = orderTableData.length;
  const reviewsCount = customerRatingsTableData.length;

  const defaultAddress = customer.addresses && customer.addresses.find((a) => a.isDefault) || customer.addresses?.[0];
  const addressLine = defaultAddress
    ? [defaultAddress.city, defaultAddress.state, defaultAddress.country].filter(Boolean).join(', ')
    : '';

  const wishlistCount = (customerWithWishlist && customerWithWishlist.wishlist && customerWithWishlist.wishlist.length) || 0;
  const profileWishlistTableData = (customerWithWishlist?.wishlist || []).slice(0, 20).map((item) => {
    const product = item.product || {};
    const price = product.salePrice != null ? product.salePrice : product.price;
    const priceStr = price != null ? `$${Number(price).toFixed(0)}` : '';
    return {
      product: product.name || 'Product',
      productImage: (product.image && product.image.url) || '/products/1.png',
      color: '',
      size: '',
      price: priceStr,
      total: priceStr,
    };
  });

  const favoriteStores = (customer.metrics && customer.metrics.favoriteStores) || [];
  const storeIds = favoriteStores.map((f) => f.store).filter(Boolean);
  const storesMap = {};
  if (storeIds.length > 0) {
    const stores = await Store.find({ _id: { $in: storeIds } }).select('name slug').lean();
    stores.forEach((s) => { storesMap[s._id.toString()] = s; });
  }
  const profileStoresTableData = favoriteStores.slice(0, 20).map((fav) => {
    const s = storesMap[fav.store && fav.store.toString ? fav.store.toString() : fav.store];
    return {
      product: (s && s.name) || 'Store',
      productImage: '/brand2/dell.png',
      rating: 0,
      orders: fav.orderCount || 0,
      total: fav.totalSpent != null ? `$${Number(fav.totalSpent).toFixed(0)}` : '$0',
      date: '',
    };
  });
  const storeItems = favoriteStores.slice(0, 12).map((fav) => {
    const s = storesMap[fav.store && fav.store.toString ? fav.store.toString() : fav.store];
    return {
      name: (s && s.name) || 'Store',
      rating: 4,
      people: 0,
      image: 'brand2/dell.png',
    };
  });

  const totalSpent = (customer.metrics && customer.metrics.totalSpent) || 0;
  const totalOrders = (customer.metrics && customer.metrics.totalOrders) || ordersCount;
  const lastOrderDate = (customer.metrics && customer.metrics.lastOrderDate)
    ? new Date(customer.metrics.lastOrderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const joinedDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  return res.render('landing/profile', {
    store,
    customer,
    isCustomerStorefront: true,
    ordersCount,
    reviewsCount,
    wishlistCount,
    orderTableData,
    customerRatingsTableData,
    profileWishlistTableData,
    profileStoresTableData,
    storeItems,
    monthsShort,
    defaultAddress,
    addressLine,
    customerName: customer.name || customer.email || 'Customer',
    customerEmail: customer.email || '',
    customerPhone: customer.phone || '',
    customerAvatar: (customer.avatar && customer.avatar.url) || null,
    joinedDate,
    totalSpent,
    lastOrderDate,
    totalOrders,
  });
});

/**
 * Order confirmation page (after place order).
 */
const renderOrderConfirmation = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const customerId = req.customer._id;
  const Order = require('../models/order');
  const order = await Order.findById(orderId)
    .populate({ path: 'orderItems', populate: { path: 'product', select: 'name slug' } })
    .populate('store', 'name slug')
    .lean();
  if (!order) {
    return res.redirect(302, '/profile?order=notfound');
  }
  if (String(order.customer) !== String(customerId)) {
    return res.redirect(302, '/profile?order=forbidden');
  }
  const orderNumber = order.orderNumber || order._id.toString().slice(-8);
  const totalPrice = order.totalPrice != null ? Number(order.totalPrice) : 0;
  return res.render('landing/order-confirmation', {
    order,
    orderNumber,
    totalPrice,
    isCustomerStorefront: true,
  });
});

module.exports = {
  renderCustomerHomepage,
  renderCustomerProfile,
  renderOrderConfirmation,
};

