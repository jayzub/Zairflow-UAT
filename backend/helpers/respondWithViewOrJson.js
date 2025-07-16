// Helper function for consistent response format
const respondWithViewOrJson = (req, res, view, data) => {
    if (req.accepts('html') || req.query.api) {
      res.render(view, data);
    } else {
        res.json({ success: true, data });
    }
};

module.exports = { respondWithViewOrJson };