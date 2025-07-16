const dotenv = require('dotenv');

const express = require('express');
const app = express();
const methodOverride = require('method-override');

const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

// Environment Variables
dotenv.config();

const API_URL = process.env.API_URL || '/api/v1';

const { flatSitemap } = require('../gulp/pug.gulp');

// Move these imports to the top, after dotenv config
require('./models/products/electronics');
require('./models/products/clothing');
require('./models/products/furniture');

app.use((req, res, next) => {
  res.locals.flatSitemap = flatSitemap; // Make the function available in templates
  next();
});

// Middleware Setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.options('*', cors());
app.use(morgan('tiny'));
app.use((req, res, next) => {
    res.locals.API_URL = process.env.API_URL;
    next();
});

// Static Files and View Engine
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'src', 'pug', 'apps', 'e-commerce'));
// app.set('views', path.join(__dirname, '..', 'src', 'pug'));

// app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1d' }));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security Middleware
const authJwt = require('./middleware/jwt');
app.use(authJwt());

//Sanitize user inputs to prevent injection attacks
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Error Handling Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Add method-override middleware
app.use(methodOverride('_method'));

// Routes
const productRoutes = require('./routes/productRoutes');
const categoriesRoute = require('./routes/categories');
const userRoute = require('./routes/users');
const orderRoute = require('./routes/orders');

// Health check route for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Routes
app.use(`${API_URL}/products`, productRoutes);
app.use(`${API_URL}/categories`, categoriesRoute);
app.use(`${API_URL}/users`, userRoute);
app.use(`${API_URL}/orders`, orderRoute);

// Database Connection
const connectToDatabase = require('./config/database');
connectToDatabase();

// Export the app for server and testing
module.exports = app;
