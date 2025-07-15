# Deployment Guide for Griffin Platform

## Environment Variables Required

Set these environment variables in your Render dashboard:

### Database Configuration
- `MONGODB_URI`: Your MongoDB connection string (e.g., MongoDB Atlas URI)

### JWT Configuration
- `JWT_SECRET`: A secure random string for JWT token signing

### Cloudinary Configuration (for image uploads)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### API Configuration
- `API_URL`: API base URL (default: `/api/v1`)

### Server Configuration
- `PORT`: Server port (Render will set this automatically)
- `NODE_ENV`: Environment (set to `production` for Render)

## Render Deployment Steps

1. **Connect your GitHub repository** to Render
2. **Create a new Web Service** and select your repository
3. **Configure the service**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:render`
   - **Environment**: Node
   - **Plan**: Free (or choose your preferred plan)

4. **Add Environment Variables** in the Render dashboard using the list above

5. **Deploy** - Render will automatically build and deploy your application

## Local Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the environment variables listed above
4. Start development server: `npm run dev`

## Features

- **E-commerce Product Management**: Add, edit, delete products
- **Product Filtering**: Advanced filtering with categories, brands, prices
- **Admin Dashboard**: Manage products, categories, and orders
- **Image Upload**: Cloudinary integration for product images
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: AJAX-powered product loading

## API Endpoints

- `GET /api/v1/products` - Get all products
- `POST /api/v1/products` - Create new product
- `GET /api/v1/products/:id` - Get product by ID
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/orders` - Get all orders 