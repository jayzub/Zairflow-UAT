// Helper function to check if request expects JSON (API/XHR)
// - /api/* is always API. - /admin/* is API only when client sends Accept: application/json or X-Requested-With: XMLHttpRequest
const isApiRequest = (req) => {
    if (req.originalUrl.startsWith('/api')) return true;
    if (!req.originalUrl.startsWith('/admin')) return false;
    const accept = (req.get('Accept') || '').toLowerCase();
    const wantsJson = accept.includes('application/json');
    const isXhr = req.get('X-Requested-With') === 'XMLHttpRequest';
    return wantsJson || isXhr;
};

// Admin sign-in path for redirect when access is required (browser page request)
const ADMIN_SIGN_IN_PATH = '/admin/auth/sign-in';

// Helper function to handle authentication/authorization errors consistently
const handleAuthError = (req, res, message, statusCode = 401) => {
    if (isApiRequest(req)) {
        return res.status(statusCode).json({
            success: false,
            error: message
        });
    }
    // Browser page request: redirect to sign-in for 401 on admin routes, otherwise render error page
    if (statusCode === 401 && req.originalUrl.startsWith('/admin')) {
        const redirectUrl = encodeURIComponent(req.originalUrl);
        return res.redirect(302, `${ADMIN_SIGN_IN_PATH}?redirect=${redirectUrl}`);
    }
    if (statusCode === 401) {
        return res.status(statusCode).render('errors/401', {
            title: '401 - Unauthorized',
            message: message || 'Authentication required.',
        });
    }
    if (statusCode === 403) {
        return res.status(statusCode).render('errors/403', {
            title: '403 - Forbidden',
            message: message || 'Access denied.',
        });
    }
    if (statusCode === 404) {
        return res.status(statusCode).render('errors/404', {
            title: '404 - Not Found',
            message: message || 'Resource not found.',
        });
    }
    return res.status(statusCode).render('errors/500', {
        title: '500 - Internal Server Error',
        message: message || 'Something went wrong.',
    });
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