# Go-Live Features List — Griffin E-Commerce Platform

**Role:** Business Analyst / Product Owner  
**Purpose:** Complete list of features required for a safe MVP Go-Live. Use this to flesh out user stories and acceptance criteria.

**References:** `MVP_GO_LIVE_CHECKLIST.md`, `PROCESS_FLOW_ADD_TO_CART_TO_CHECKOUT.md`, `MULTI_TENANT_ARCHITECTURE.md`

---

## 1. Auth & Security

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 1.1 | **Admin auth model** | Single mechanism for admin auth (e.g. HttpOnly cookie for session; no reliance on localStorage Bearer for privileged admin APIs). Documented and consistent. | ✅ Done |
| 1.2 | **Admin login protection** | Rate limiting and optional brute-force protection on `/admin/login` (and register if public). | ✅ Done |
| 1.3 | **Admin password reset** | Forgot password flow: token generation, expiry, reset POST; wired to “Forgot password?” in admin UI, or hide link and show “Contact support” for MVP. | ✅ Done |
| 1.4 | **Admin logout** | Logout clears server session/cookie and client storage; logout reachable from admin UI. | ✅ Done |
| 1.5 | **Admin route protection** | All admin routes (orders, customers, categories, vendors, custom types, products, etc.) use consistent `requireAuth`, `requirePermission(...)`, and store isolation; no bypass. | ✅ Done |
| 1.6 | **Admin sign-up policy** | Admin registration: only expose if policy is defined; otherwise restrict to invite/CLI-created admins and hide public sign-up. | ⬜ Pending |
| 1.7 | **Customer auth** | Customer sign-in, sign-up, session sync, logout; JWT/cookie; redirect after login (e.g. to cart/checkout). | ✅ Done |
| 1.8 | **Customer profile & addresses** | Customer can view/update profile and manage multiple addresses (add, edit, remove). | ✅ Done |

---

## 2. Product & Catalog

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 2.1 | **Product CRUD (admin)** | Create, read, update, delete products; store isolation; support for product types and custom types. | ✅ Done |
| 2.2 | **Product variants** | Variants (e.g. color, size) with pricing and inventory; variant-level stock and deduction. | ✅ Done |
| 2.3 | **Bulk product import** | CSV import with defined max row count and file size; validation; clear errors; optional downloadable error CSV. | ✅ Done (error CSV optional) |
| 2.4 | **Product delete semantics** | Documented soft vs hard delete; admin “Delete” copy matches behavior. | ✅ Done |
| 2.5 | **Product list filters** | Admin products list: category and vendor filters (query params + backend), or hide non-functional filters. | ✅ Done |
| 2.6 | **Product export** | Admin products list: Export (CSV/Excel) or remove/disable button for MVP. | ✅ Done |
| 2.7 | **Product types validation** | All configured product types (and custom types) validated; misconfig returns clear 4xx, not runtime crashes. | ✅ Done |
| 2.8 | **Categories** | Category CRUD; category tree; products by category; store-scoped. | ✅ Done |
| 2.9 | **Vendors** | Vendor CRUD and stats; store-scoped. | ✅ Done |
| 2.10 | **Custom product types** | Admin can define and manage custom product types for store. | ✅ Done |
| 2.11 | **Product discovery (customer)** | Browse products by store/marketplace; product detail page (PDP) with images, price, sale price, variants, availability. | ✅ Done |
| 2.12 | **Stock/availability on PDP** | Show “In stock” / “Low stock” / “Out of stock”; disable Add to Cart when unavailable. | ✅ Done |

---

## 3. Admin UI & Operations

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 3.1 | **Admin dashboard** | Dashboard with stats (e.g. orders, revenue, products); store-scoped for store admins. | ✅ Done |
| 3.2 | **Products list & actions** | List products; add, edit, import, restore deleted; view deleted products; filters; export. | ✅ Done |
| 3.3 | **Import UX** | Import page shows max file size and max rows; post-import CTA “View products” / “Back to products list”. | ✅ Done |
| 3.4 | **Orders management** | List orders; view order details; update order status; store isolation. | ✅ Done |
| 3.5 | **Refunds** | Admin can process refund (amount, reason); order status updated to refunded; refund page and API. | ✅ Done |
| 3.6 | **Customers management** | List customers; view/edit customer details; store-scoped where applicable. | ✅ Done |
| 3.7 | **User/Admin management** | Create store admins; list/update/delete users; permissions; store access. | ✅ Done |
| 3.8 | **Admin profile & change password** | Admin can view/update own profile and change password. | ✅ Done |

---

## 4. Customer Storefront — Cart & Browse

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 4.1 | **Add to cart** | From PDP: quantity, options (color/size); backend validates product, variant, inventory; cart updated; badge and toast. | ✅ Done |
| 4.2 | **Cart context** | Store vs marketplace cart scope; one cart per customer per scope (and per store when store scope). | ✅ Done |
| 4.3 | **Cart page** | View cart; line items (image, name, variant, price, quantity); update quantity; remove item; subtotal, discount, total. | ✅ Done |
| 4.4 | **Promo/coupon** | Apply promo code to cart; discount applied; remove promo; validation on apply and at place-order. | ✅ Done |
| 4.5 | **Cart summary** | Subtotal, promo discount, estimated tax, estimated shipping, total; scope preserved (store/marketplace). | ✅ Done |
| 4.6 | **Proceed to checkout** | “Proceed to Checkout” links to checkout with correct scope (scopeType, storeId). | ✅ Done |
| 4.7 | **Out-of-stock / price change (cart)** | Add-to-cart enforces inventory; place-order re-checks stock and price; 409 with clear message; redirect to cart. | ✅ Done |
| 4.8 | **Wishlist** | Customer can add/remove products from wishlist and view wishlist. | ✅ Done |
| 4.9 | **Recently viewed** | Track and display recently viewed products (if used in UI). | ✅ Done |
| 4.10 | **Customer orders list** | Customer can view their orders (profile/orders) with status and details. | ✅ Done |

---

## 5. Checkout & Payments

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 5.1 | **Checkout page** | Route and template; requires customer auth; load cart by scope; summary from cart. | ✅ Done |
| 5.2 | **Shipping address** | Load from profile (saved addresses); select or enter; send with place-order. | ✅ Done |
| 5.3 | **Shipping methods** | API returns available shipping methods (id, name, price, estimated days); checkout UI selection; selected cost in order total. | ✅ Done |
| 5.4 | **Place order from cart** | Create order(s) from cart (one per store in marketplace); order number, line items, totals, address, shipping, customer; clear cart on success. | ✅ Done |
| 5.5 | **Inventory deduction** | On place-order: decrement product/variant stock; variant-level when applicable. | ✅ Done |
| 5.6 | **COD (Cash on Delivery)** | Payment method COD; order created with `paymentStatus: 'paid'` (or equivalent). | ✅ Done |
| 5.7 | **Card payment (Stripe)** | **Go-Live decision:** Either (A) implement Stripe server-side charge (create/confirm PaymentIntent in place-order, set `paymentStatus: 'paid'` only on success), or (B) treat MVP as COD/offline only and hide or clearly label card option until gateway is wired. | ⬜ Pending |
| 5.8 | **Payment status copy** | If card is shown but not charged: confirmation and order history must not say “Payment received” for card orders; use “Payment pending” or equivalent when `paymentStatus === 'pending'`. | ⬜ Verify |
| 5.9 | **Checkout error handling** | 409 (out-of-stock, price change) and 400 (invalid promo) with clear messaging; redirect to cart; no cart clear on failure. | ✅ Done |

---

## 6. Orders & Fulfillment

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 6.1 | **Order confirmation page** | After place-order: redirect to confirmation page; order number, items, address, total, status, payment method; links to “View my orders” and “Continue shopping”. | ✅ Done |
| 6.2 | **Order confirmation email** | Send email after order (when SMTP configured); order summary, total; no-op when SMTP not set. | ✅ Done |
| 6.3 | **Order status workflow** | Order statuses: pending, confirmed, processing, shipped, delivered, cancelled, refunded; admin can update status. | ✅ Done |
| 6.4 | **Tracking (optional)** | Store tracking number and date shipped/delivered on order; display in admin and optionally to customer. | ✅ Done (model/API); verify customer-facing display |
| 6.5 | **Refund handling** | Admin processes refund; order status and payment status updated; customer-facing messaging if needed. | ✅ Done |

---

## 7. Platform & Multi-Tenancy

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 7.1 | **Store model** | Store has name, slug, owner, settings (currency, timezone, tax rate, etc.), subscription/plan. | ✅ Done |
| 7.2 | **Store isolation** | All entities (products, orders, categories, etc.) scoped by store; middleware enforces store context (subdomain, header, or query). | ✅ Done |
| 7.3 | **Store creation** | Create store and store owner (script or API); store owner can have multiple stores. | ✅ Done |
| 7.4 | **Platform admin** | Platform admin role; access all stores; platform overview/analytics; store verification/status. | ✅ Done |
| 7.5 | **Store admin / permissions** | Store owner and store admin roles; permission-based access (product, order, customer, category, vendor, etc.). | ✅ Done |
| 7.6 | **Subdomain routing** | Store access via `{store-slug}.domain` (or documented alternative). | ✅ Done (documented) |
| 7.7 | **Subscription/limits** | Optional subscription limits (e.g. products per plan); checkStoreLimits middleware. | ✅ Done (if used) |

---

## 8. Operational & Infrastructure

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 8.1 | **Environment/config checklist** | Single doc (e.g. `ENV_CHECKLIST.md`) listing all env vars by feature (auth, DB, email, Stripe, Redis, etc.); required vs optional; safe defaults; graceful degradation when unset. | ⬜ Pending |
| 8.2 | **Structured logging** | Request/correlation ID, level, context for: admin login (especially failures), bulk import start/finish/fail, checkout/order creation. | ⬜ Pending |
| 8.3 | **Health & monitoring** | Health endpoint; DB connectivity check; optional Redis check; alerting on 5xx spike or critical failures. | ⬜ Pending |
| 8.4 | **Runbooks** | Document: one-off scripts (e.g. variant ID migration, seeding) in production; handling failed/partial bulk imports; rolling back inventory if checkout bug found. | ⬜ Pending |
| 8.5 | **Deployment** | Documented deployment (e.g. Render); build and start commands; env vars; DB backups and restore. | ✅ Done (high level) |
| 8.6 | **Secrets** | Production secrets (JWT, DB, SMTP, Stripe if card live) documented and verified before go-live. | ⬜ Verify at 6.2 |

---

## 9. Pre-Launch & Verification

| # | Feature | Description | Go-Live Status |
|---|---------|-------------|----------------|
| 9.1 | **Smoke test** | End-to-end: admin login, create/edit product, bulk import (small file), customer sign-in, add to cart, checkout (COD and card if enabled), order confirmation and email. | ⬜ Pending |
| 9.2 | **Production env verification** | All required secrets set; Stripe keys only if card payments are live. | ⬜ Pending |
| 9.3 | **Backup & restore** | Backup/restore and deployment process confirmed for target environment. | ⬜ Pending |

---

## 10. Optional / Post–Go-Live (Deferred)

| # | Feature | Notes |
|---|---------|------|
| 10.1 | **Downloadable error CSV** | For failed bulk import rows. |
| 10.2 | **Address verification** | Third-party address validation on checkout. |
| 10.3 | **Shipping estimate on PDP** | By region or product. |
| 10.4 | **SMS order notification** | e.g. Twilio. |
| 10.5 | **Guest checkout** | Currently customer login required for cart/checkout. |
| 10.6 | **Idempotency key** | For place-order to avoid duplicate charges on retry. |

---

## Summary for Go-Live

- **Must complete before live orders:**  
  - **5.7** — Payment: Stripe charge **or** COD-only with card hidden/clearly labeled.  
  - **5.8** — Confirmation/history copy for card “pending” (no “Payment received”).  
  - **1.6** — Admin sign-up policy (expose or restrict).  
  - **8.1–8.4** — Env checklist, logging, health/monitoring, runbooks.  
  - **9.1–9.3** — Smoke test, production secrets, backup/restore.

- **Already in good shape:** Auth, product/catalog, admin UI, cart, checkout flow (COD), order creation, confirmation page and email, platform/multi-tenant, refunds.

Use this list to create user stories (e.g. “As a …, I want … so that …”) and acceptance criteria for each feature you prioritize for go-live.
