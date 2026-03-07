# Admin Authentication Model

Griffin admin authentication uses **HTTP-only cookies** as the single canonical mechanism. This reduces XSS risk by keeping the session token out of JavaScript and localStorage.

## How it works

- **Login:** `POST /admin/login` with email/password. On success, the server sets an HTTP-only cookie named `token` (same path/domain as the app) and returns user display info only (e.g. `user`, `role`, `isPlatformAdmin`). The token is **not** returned in the JSON body.
- **Authenticated requests:** Admin API requests (e.g. `/admin/me`, `/admin/stores/my-stores`, `/admin/products`) are sent with `credentials: 'include'` so the browser sends the cookie. The backend reads the token from `req.cookies.token` or `req.headers.authorization` (see middleware below). No Bearer token is stored in or read from localStorage for auth.
- **Logout:** `POST /admin/logout` or `GET /admin/logout` clears the `token` cookie. The client should also clear any local display state (e.g. `adminUser` in localStorage) and redirect to `/admin/auth/sign-in`.

## Backend

- **Cookie:** Set in `adminAuthController.login` with `httpOnly: true`, `secure` in production, `sameSite: 'lax'`, `path: '/'`, 1-day `maxAge`.
- **Middleware:** `backend/middleware/jwt.js` `requireAuth` accepts the token from either `Authorization: Bearer <token>` or `req.cookies.token` (cookie preferred for browser clients).
- **Logout:** `adminAuthController.logout` clears the cookie with `res.clearCookie('token', { httpOnly: true, path: '/', sameSite: 'lax' })`.

## Frontend

- **Sign-in:** After a successful login response, the client stores only non-sensitive display info in localStorage (e.g. `adminUser` with email/role) for UI. All fetch calls to admin APIs use `credentials: 'include'` and do **not** send an `Authorization` header from localStorage.
- **“Am I logged in?”:** Pages that need to protect routes call `fetch('/admin/me', { credentials: 'include', ... })`. If the response is not OK, they redirect to `/admin/auth/sign-in`.
- **Logout:** Buttons/links that sign out call `fetch('/admin/logout', { method: 'POST', credentials: 'include' })`, then clear `adminToken` and `adminUser` from localStorage, then redirect to sign-in.

## Security notes

- The token is never stored in localStorage, so it is not exposed to script-based XSS.
- Cookie is `httpOnly` and `sameSite: 'lax'`; in production `secure` ensures it is only sent over HTTPS.
- **Rate limiting:** `POST /admin/login` and `POST /admin/register` are protected by per-IP rate limits (see `backend/middleware/rateLimiting.js`: `adminLoginLimit`, `adminRegisterLimit`). When exceeded, the API returns 429 with a JSON body; the sign-in page shows the `message` to the user.

## References

- `backend/controllers/adminControllers/adminAuthController.js` — login, logout, cookie options
- `backend/routes/adminRoutes/authApi.js` — POST/GET `/admin/logout`
- `backend/middleware/jwt.js` — requireAuth reads cookie or Bearer
- `docs/MVP_GO_LIVE_CHECKLIST.md` — item 1.1
