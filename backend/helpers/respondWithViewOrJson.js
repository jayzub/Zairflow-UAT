// Helper function for consistent response format
const respondWithViewOrJson = (req, res, view, data) => {
    // Check if this is an API request (explicit JSON request or query parameter)
    if (req.query.api || req.headers['accept'] === 'application/json') {
        res.json({ success: true, data });
    } else {
        // Default to HTML for browser requests
        res.render(view, data);
    }
};

module.exports = { respondWithViewOrJson };