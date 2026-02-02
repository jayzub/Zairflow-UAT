// Helper function for consistent response format
const respondWithViewOrJson = (req, res, view, data) => {
    // Check if this is an API/JSON request (query param, XHR, or Accept header)
    const accept = String(req.headers?.accept || '');
    const wantsJson =
        Boolean(req.query?.api) ||
        req.xhr === true ||
        String(req.headers?.['x-requested-with'] || '').toLowerCase() === 'xmlhttprequest' ||
        accept.includes('application/json');

    if (wantsJson) return res.json({ success: true, data });

    // Default to HTML for browser requests
    return res.render(view, data);
};

module.exports = { respondWithViewOrJson };