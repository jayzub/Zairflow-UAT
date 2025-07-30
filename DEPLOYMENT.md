# Griffin Platform Deployment Guide

## Render Deployment

This guide will help you deploy the Griffin e-commerce platform on Render.

### Prerequisites

1. **MongoDB Database**: You'll need a MongoDB database. We recommend using MongoDB Atlas (free tier):
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
   - Create a free account
   - Create a new cluster
   - Get your connection string

### Environment Variables

Set these environment variables in your Render dashboard:

1. Go to your Render service dashboard
2. Navigate to the "Environment" tab
3. Add the following variables:

```
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
API_URL=/api
NODE_ENV=production
```

### Build Configuration

The project uses the following build configuration in `render.yaml`:

```yaml
services:
  - type: web
    name: griffin-platform
    env: node
    buildCommand: npm run build:render
    startCommand: npm run start:render
    envVars:
      - key: NODE_ENV
        value: production
```

### Build Process

The build process:
1. Installs dependencies
2. Compiles Pug templates to HTML
3. Processes SCSS to CSS
4. Copies vendor files
5. Builds the frontend assets

### Database Setup

After deployment, you may want to seed your database with sample data:

1. Set up your MongoDB connection
2. The application will automatically create collections when needed
3. You can run the seed script manually if needed

### Troubleshooting

#### Common Issues

1. **Database Connection Error**: Make sure `DB_URL` is set correctly
2. **Build Failures**: Check that all dependencies are in the main `package.json`
3. **Port Issues**: The app runs on port 10000 by default

#### Getting Help

- Check the Render logs for detailed error messages
- Ensure all environment variables are set correctly
- Verify your MongoDB connection string is valid

### Local Development

For local development:

1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with your configuration
4. Run `npm run dev` for development mode
5. Run `npm run build` to build for production

### File Structure

```
griffin/
├── backend/          # Node.js/Express backend
├── src/             # Source files (Pug, SCSS)
├── public/          # Built frontend files
├── gulp/            # Build tasks
└── package.json     # Dependencies and scripts
```

### API Endpoints

The API is available at `/api/`:

- `/api/products` - Product management
- `/api/categories` - Category management  
- `/api/users` - User management
- `/api/orders` - Order management

### Health Check

The application provides a health check endpoint at `/health` for monitoring. 