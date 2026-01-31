/**
 * Customer-facing server-rendered pages (Pug).
 */

const Category = require('../models/category');
const BaseProduct = require('../models/products/baseProduct');
const { asyncHandler } = require('../middleware/asyncHandler');

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

module.exports = {
  renderCustomerHomepage,
};

