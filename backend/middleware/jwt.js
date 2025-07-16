const jwt = require('express-jwt');

function authJwt() {
    const secret = process.env.secret;
    const api = process.env.API_URL;

    return jwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked,
    }).unless({
        path: [
            { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: new RegExp(`${api}/users/login`), methods: ['POST'] },
            { url: new RegExp(`${api}/users/register`), methods: ['POST'] },
            { url: /(.*)/ },//
        ],
    });
}

async function isRevoked(req, payload, done) {
    console.log('Payload:', payload);
    if (!payload.isAdmin) {
        console.log('Token revoked for non-admin user');
        return done(null, true); // Revoke token
    }
    console.log('Token valid');
    done(); // Token is valid
}

module.exports = authJwt;
