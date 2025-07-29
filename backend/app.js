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
const API_URL = process.env.API_URL || '/api/v1';
const { flatSitemap } = require('../gulp/pug.gulp');

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
  next();
});

// Routes
const productRoutes = require('./routes/products');
const categoriesRoute = require('./routes/categories');
const userRoute = require('./routes/users');
const orderRoute = require('./routes/orders');
const storeRoutes = require('./routes/stores');
const platformRoutes = require('./routes/platform');
const customerRoutes = require('./routes/customers');
const adminRoutes = require('./routes/admin');
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

// API Routes
app.use(`${API_URL}/products`, productRoutes);
app.use(`${API_URL}/categories`, categoriesRoute);
app.use(`${API_URL}/users`, userRoute);
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