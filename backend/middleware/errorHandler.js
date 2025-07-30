function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;
    const env = process.env.NODE_ENV || 'development';
  
    // Log the error stack in dev mode
    if (env === 'development') {
      console.error(err.stack);
    }
  
    // If it's an API request (e.g., /api/*), send JSON
    const isApiRequest = req.originalUrl.startsWith('/api');
  
    if (isApiRequest) {
      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
          success: false,
          message: 'The user is not authorized',
        });
      }
  
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: err.message || 'Validation failed',
        });
      }
  
      return res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
      });
    }
  
    // Otherwise, render Pug error pages for non-API requests
    res.status(statusCode);
  
    if (statusCode === 401) {
      return res.render('errors/401', {
        title: '401 - Unauthorized',
        message: err.message || 'Authentication required.',
      });
    }
  
    if (statusCode === 403) {
      return res.render('errors/403', {
        title: '403 - Forbidden',
        message: err.message || 'Access denied.',
      });
    }
  
    if (statusCode === 404) {
      return res.render('errors/404', {
        title: '404 - Page Not Found',
        message: err.message || 'Page not found.',
      });
    }
  
    // Generic 500 or other errors
    res.render('errors/500', {
      title: '500 - Internal Server Error',
      message: env === 'development' ? err.message : 'Something went wrong.',
    });
  }
  
  module.exports = errorHandler;  