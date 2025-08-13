// Helper function to check if request is API
const isApiRequest = (req) => {
    return req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/admin');
};

// Helper function to handle authentication/authorization errors consistently
const handleAuthError = (req, res, message, statusCode = 401) => {
    if (isApiRequest(req)) {
        return res.status(statusCode).json({ 
            success: false,
            error: message 
        });
    } else {
        // For web requests, render appropriate error page
        if (statusCode === 401) {
            return res.status(statusCode).render('errors/401', {
                title: '401 - Unauthorized',
                message: message || 'Authentication required.',
            });
        } else if (statusCode === 403) {
            return res.status(statusCode).render('errors/403', {
                title: '403 - Forbidden',
                message: message || 'Access denied.',
            });
        } else if (statusCode === 404) {
            return res.status(statusCode).render('errors/404', {
                title: '404 - Not Found',
                message: message || 'Resource not found.',
            });
        } else {
            // Default to 500 error page for other status codes
            return res.status(statusCode).render('errors/500', {
                title: '500 - Internal Server Error',
                message: message || 'Something went wrong.',
            });
        }
    }
};

// Helper function to handle general errors consistently
const handleError = (req, res, message, statusCode = 500) => {
    if (isApiRequest(req)) {
        return res.status(statusCode).json({ 
            success: false,
            error: message 
        });
    } else {
        // For web requests, render 500 error page
        return res.status(statusCode).render('errors/500', {
            title: '500 - Internal Server Error',
            message: message || 'Something went wrong.',
        });
    }
};

module.exports = {
    isApiRequest,
    handleAuthError,
    handleError
}; 