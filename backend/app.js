const dotenv = require('dotenv');

require('./models/products/electronics');
require('./models/products/clothing');
require('./models/products/furniture');
require('./models/customer');

const express = require('express');
const app = express();
const methodOverride = require('method-override');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Environment Variables - Load .env file only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const API_URL = process.env.API_URL || '/api/v1';

const { flatSitemap } = require('../gulp/pug.gulp');

app.use((req, res, next) => {
  res.locals.flatSitemap = flatSitemap; // Make the function available in templates
  next();
});

// Middleware Setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
// app.use(cors());
// app.options('*', cors());
app.use(cors({
  origin: 'http://localhost:3000', // <-- your frontend URL
  credentials: true                // <-- allow cookies to be sent
}));
app.options('*', cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('tiny'));
app.use((req, res, next) => {
    res.locals.API_URL = process.env.API_URL;
    next();
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'src', 'pug', 'apps', 'e-commerce'));

// Routes
const productRoutes = require('./routes/products');
const categoriesRoute = require('./routes/categories');
const userRoute = require('./routes/users');
const orderRoute = require('./routes/orders');
const storeRoutes = require('./routes/stores');
const platformRoutes = require('./routes/platform');
const customerRoutes = require('./routes/customers');
const adminRoutes = require('./routes/admin');

// Health check route for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
// Health check endpoint
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

// Swagger Documentation (must be before auth middleware)
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

//Sanitize user inputs to prevent injection attacks
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Error Handling Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Add method-override middleware
app.use(methodOverride('_method'));

// Import authentication middleware (will be applied to specific routes)
const { authJwt } = require('./middleware/jwt');

// Root route - render landing page
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

// Admin Frontend Routes
// app.use(`${API_URL}/admin`, adminRoutes);
app.use('/admin', adminRoutes); // Add this line for cleaner URLs

// Static file middleware (after routes to allow Pug rendering)
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1d' }));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const connectToDatabase = require('./config/database');

// Export the app for server and testing
module.exports = { app, connectToDatabase };
