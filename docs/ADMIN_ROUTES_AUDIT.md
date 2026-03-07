# Admin Routes Audit (MVP 1.5)

This document records the audit of admin routes for consistent `requireAuth`, `requirePermission(...)`, and store isolation (`checkUserStores`, `extractStore`, `requireStoreAccess`). All sensitive admin routes must use these; only public auth pages and auth API (login, register, logout, forgot-password, reset-password) are intentionally unauthenticated.

## Pattern

Protected admin routes use this order:

1. **requireAuth** (jwt) – ensures `req.user` is set
2. **requirePermission(permission)** (rbac) – ensures user role has the required permission
3. **checkUserStores** – ensures user has at least one store (or is platform admin); redirects to create-store if not
4. **extractStore** – sets store context from query/body/params where applicable
5. **requireStoreAccess('any')** – ensures user can access the resolved store
6. Validators and controller

Routes that are **store-agnostic** (e.g. list my stores, create store) still use `requireAuth`, `requirePermission`, and `checkUserStores`; `extractStore` / `requireStoreAccess` apply when the route is scoped to a specific store.

## Route summary

| Module | Mount | Auth | Permission | Store isolation | Notes |
|--------|--------|------|------------|-----------------|--------|
| **authPages** | `/` | No | No | No | Public: auth index, sign-in, sign-up, forgot-password, reset-password pages |
| **authApi** | `/` | No | No | No | Public: login, register, logout, forgot-password, reset-password APIs |
| **meApi** | `/` | Yes | No | No | /me, /me update, change-password (user-scoped only) |
| **pages** | `/` | Yes | user:create_admin | Yes | create-admin, pages/create-admin |
| **dashboard** | `/` | Yes | analytics:read | Yes | /, /dashboard, /dashboard/stats |
| **products** | `/` | Yes | product:* | Yes | All product list/add/edit/import/count/featured |
| **categories** | `/` | Yes | category:* or analytics:read | Yes | All category routes |
| **vendors** | `/` | Yes | vendor:* or analytics:read | Yes | All vendor routes |
| **customers** | `/` | Yes | customer:* | Yes | All customer routes |
| **orders** | `/` | Yes | order:read / order:update | Yes | All order and refund routes |
| **stores** | `/` | Yes | store:* / analytics:read | Yes | create-store, my-stores, list, by-id, settings, theme, admins |
| **users** | `/` | Yes | user:* | Yes | admins, users, create-store-admin |
| **productTypes** | `/` | Yes | product_type:read | Yes | GET /product-types/config |
| **customProductTypes** | `/custom-product-types` | Yes | product_type:* | Yes | GET / (page+api), GET /api, GET /:id, POST /, PUT /:id, DELETE /:id (via router.use(requireAuth) + permission per route) |

## Changes made (1.5)

- **dashboard.js:** Added `requirePermission('analytics:read')` to `GET /` and `GET /dashboard` so dashboard index and dashboard page are permission-gated consistently with `/dashboard/stats`. Previously they had only `requireAuth` and store isolation.
- No other routes were missing auth or store isolation; **customProductTypes** uses `router.use(requireAuth)`, `router.use(requirePermission('product_type:read'))`, and store middleware for all routes defined after the first `GET /`.

## References

- `backend/middleware/jwt.js` – requireAuth
- `backend/middleware/rbac.js` – requirePermission, PERMISSIONS
- `backend/middleware/admin/checkUserStores.js` – checkUserStores
- `backend/middleware/storeIsolation.js` – extractStore, requireStoreAccess
