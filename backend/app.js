const dotenv = require('dotenv');
const express = require('express');
const methodOverride = require('method-override');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const createError = require('http-errors');
const errorHandler = require('./middleware/errorHandler');

// Load .env only in non-production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const API_URL = process.env.API_URL || '/api';
const { flatSitemap } = require('../gulp/pug.gulp');

// Express configuration for consistent routing
app.set('strict routing', true); // Prevents automatic trailing slash handling
app.set('case sensitive routing', true); // Case-sensitive route matching

// Middleware to handle trailing slashes
// app.use((req, res, next) => {
//   // Remove trailing slash except for root path
//   if (req.path.length > 1 && req.path.endsWith('/')) {
//     const newPath = req.path.slice(0, -1);
//     return res.redirect(301, newPath + (req.query ? '?' + new URLSearchParams(req.query).toString() : ''));
//   }
//   next();
// });

// Load models
require('./models/products/electronics');
require('./models/products/clothing');
require('./models/products/furniture');
require('./models/customer');

// Pug setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'src', 'pug', 'apps', 'e-commerce'));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('tiny'));
app.use(mongoSanitize());
app.use(methodOverride('_method'));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.options('*', cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Local variables
app.use((req, res, next) => {
  res.locals.flatSitemap = flatSitemap;
  res.locals.API_URL = process.env.API_URL;
  // Inject nav display name for navbar (admin = req.user, customer = req.customer)
  const originalRender = res.render;
  res.render = function (view, options, fn) {
    const opts = typeof options === 'object' && options !== null ? { ...options } : {};
    if (req.user) {
      const name = req.user.name || [req.user.firstName, req.user.lastName].filter(Boolean).join(' ').trim() || req.user.email || '';
      opts.navUser = { name: name || 'Admin' };
    } else if (req.customer) {
      opts.navUser = { name: req.customer.name || req.customer.email || 'Customer' };
    } else {
      opts.navUser = null;
    }
    return originalRender.call(this, view, opts, fn);
  };
  next();
});

// Routes
const productRoutes = require('./routes/products');
const categoriesRoute = require('./routes/categories');
// const userRoute = require('./routes/users');
const orderRoute = require('./routes/orders');
const storeRoutes = require('./routes/stores');
const platformRoutes = require('./routes/platform');
const customerRoutes = require('./routes/customers');
const marketplaceRoutes = require('./routes/marketplace');
const customerAuthPagesRoutes = require('./routes/customerAuthPages');
const customerPagesRoutes = require('./routes/customerPages');
const adminRoutes = require('./routes/adminRoutes');
const { authJwt } = require('./middleware/jwt');

// Health Check (API and Render)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.get(`${API_URL}/health`, (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Multi-Tenant Ecommerce Platform API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    tryItOutEnabled: true
  },
  explorer: true
}));

// Public site routes
app.get('/', (req, res) => {
  res.render('index');
});

// Customer UI routes (server-rendered)
app.use('/', customerPagesRoutes);

// Customer auth UI routes (server-rendered)
app.use('/', customerAuthPagesRoutes);

// API Routes
app.use(`${API_URL}/products`, productRoutes);
app.use(`${API_URL}/marketplace`, marketplaceRoutes);
app.use(`${API_URL}/categories`, categoriesRoute);
// app.use(`${API_URL}/users`, userRoute);
app.use(`${API_URL}/orders`, orderRoute);
app.use(`${API_URL}/stores`, storeRoutes);
app.use(`${API_URL}/platform`, platformRoutes);
app.use(`${API_URL}/customers`, customerRoutes);

// Admin Routes
app.use('/admin', adminRoutes);

// Static files
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1d' }));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 🔥 Error Handling Section ---

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Centralized error handler
app.use(errorHandler);

// Database connection export
const connectToDatabase = require('./config/database');
module.exports = { app, connectToDatabase };