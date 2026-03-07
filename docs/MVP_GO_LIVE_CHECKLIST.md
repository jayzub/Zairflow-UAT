# MVP Go-Live Checklist

A short, ordered task list to get Griffin to a safe MVP launch. Work through items in order; check off as done. Items marked **High risk** should be completed before taking live orders.

---

## 1. Auth & security

- [x] **1.1** Decide admin auth model: prefer HttpOnly cookie for session token; avoid relying on `localStorage` Bearer for privileged admin APIs. Document or refactor so one mechanism is canonical.
- [x] **1.2** Add rate limiting (and optional brute-force protection) to `/admin/login` (and register if public).
- [x] **1.3** Admin password reset: verify backend (token generation, expiry, reset POST) is implemented and wired to “Forgot password?” template; otherwise hide the link or add a “Contact support” message for MVP.
- [x] **1.4** Ensure explicit logout clears both server session/cookie and client storage and that logout is reachable from admin UI.
- [x] **1.5** Audit all admin routes (orders, customers, categories, vendors, custom types, etc.) for consistent `requireAuth`, `requirePermission(...)`, and store isolation; fix any that bypass them.

---

## 2. Product & import

- [x] **2.1** Enforce or document a **max CSV row count and file size** for bulk product import; add validator if not present. Document in admin import UI.
- [x] **2.2** Confirm all configured product types (and custom types) are validated and misconfig yields clear 4xx, not runtime crashes.
- [x] **2.3** Document delete semantics (soft vs hard delete) for products and ensure admin “Delete” copy matches behavior.
- [x] **2.4** *(Optional for MVP)* Decide if admins need a **downloadable error CSV** for failed import rows; implement or document current behavior.

---

## 3. Admin UI

- [ ] **3.1** Products list: implement basic category/vendor filters (query params + backend) or hide non-functional filter dropdowns for MVP.
- [ ] **3.2** Products list: implement “Export” (CSV/Excel) or remove/disable the button for MVP.
- [ ] **3.3** Products import: add a “View products” / “Back to products list” CTA after import results.
- [ ] **3.4** Products import: show **max file size and max rows** in the UI, matching backend limits.
- [ ] **3.5** Admin sign-up: only expose if registration policy is defined; otherwise restrict to invite/CLI-created admins and hide public sign-up.

---

## 4. Customer flows (cart & checkout)

- [ ] **4.1** **High risk.** Run full manual flow: PDP → Add to cart → Cart → Checkout → Place order. Fix any bugs (variant availability, promo apply/remove, tax/shipping vs order totals).
- [ ] **4.2** **High risk.** Payment: either implement Stripe server-side charge (create/confirm PaymentIntent in place-order, set `paymentStatus: 'paid'` only on success) or treat MVP as **COD/offline only** and hide or clearly label card option until gateway is wired.
- [ ] **4.3** If card is shown but not charged: ensure confirmation and order history copy does not say “Payment received” for card orders; use “Payment pending” or equivalent when `paymentStatus === 'pending'`.
- [ ] **4.4** Confirm 409 handling (out-of-stock, price change) and frontend redirect/messaging work as documented in `PROCESS_FLOW_ADD_TO_CART_TO_CHECKOUT.md`.

---

## 5. Operational & infra

- [ ] **5.1** Create a **single env/config checklist** (e.g. `docs/ENV_CHECKLIST.md`): list all env vars by feature (auth, DB, email, Stripe, Redis, defaults). Mark required vs optional; note safe defaults and that non-essential features should degrade gracefully when unset.
- [ ] **5.2** Add minimal **structured logging** (request/correlation ID, level, context) for: admin login attempts (especially failures), bulk import start/finish/fail, checkout/order creation.
- [ ] **5.3** Set up **monitoring/alerting**: health endpoint, DB connectivity, and (if used) Redis; alert on 5xx spike or critical failures.
- [ ] **5.4** Document **runbooks** for: running one-off scripts (variant ID migration, seeding) in production; handling failed or partial bulk imports; rolling back inventory if a checkout bug is found.

---

## 6. Pre-launch verification

- [ ] **6.1** Smoke test: admin login, create/edit product, bulk import (small file), customer sign-in, add to cart, checkout (COD and card if enabled), order confirmation and email.
- [ ] **6.2** Verify production env has all required secrets (JWT, DB, SMTP if email needed); Stripe keys only if card payments are live.
- [ ] **6.3** Confirm backup/restore and deployment process for the target environment.

---

## References

- `docs/ADMIN_AUTH_MODEL.md` — Admin auth: cookie-only, no localStorage token.
- `docs/ADMIN_ROUTES_AUDIT.md` — Admin routes audit (requireAuth, requirePermission, store isolation).
- `docs/PROCESS_FLOW_ADD_TO_CART_TO_CHECKOUT.md` — cart/checkout flow and Phase 6.2 payment stub.
- `docs/VARIANT_ID_IMPLEMENTATION.md` — variantId in cart/order/inventory.
- `docs/BULK_PRODUCT_IMPORT_ARCHITECTURE.md` — import design and limits.
- `docs/PRODUCT_TYPES_VALIDATION.md` — product type validation and 4xx behaviour.
- `docs/PRODUCT_DELETE_SEMANTICS.md` — product soft vs hard delete; admin copy.
