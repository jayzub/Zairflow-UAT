function errorHandler(err, req, res, next) {
    // Log the error stack for debugging
    console.error(err.stack);

    // Handle specific errors
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ success: false, message: "The user is not authorized" });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: err.message || 'Validation failed' });
    }

    // Fallback for all other errors
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
}

module.exports = errorHandler;
