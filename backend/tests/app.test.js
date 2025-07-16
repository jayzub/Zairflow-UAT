const request = require('supertest');
const app = require('../app');

describe('App.js Routes and Middleware', () => {
    it('should load the root API endpoint', async () => {
        const res = await request(app).get('/api/v1/products');
        expect(res.statusCode).toBe(200); 
    });

    it('should handle unknown routes with 404', async () => {
        const res = await request(app).get('/unknown/route');
        expect(res.statusCode).toBe(404);
    });

    it('should have the correct Content-Type', async () => {
        const res = await request(app).get('/api/v1/products');
        expect(res.headers['content-type']).toContain('text/html');
    });
});
