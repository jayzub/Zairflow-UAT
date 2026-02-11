# Process Flow: Add Product to Cart Through Checkout

This document describes the end-to-end flow from adding a product to the cart through the checkout experience in the Griffin e-commerce application.

---

## 1. Overview

- **Cart scope**: The app supports two cart contexts — **store** (one cart per store when browsing a store) and **marketplace** (one cart when browsing the marketplace). Scope is determined by `req.store` (middleware) or by `scopeType` / `storeId` query/body.
- **Auth**: Cart and checkout require a signed-in **customer** (JWT in `Authorization: Bearer <token>` and/or `customerToken` cookie).
- **Data**: Cart is stored per customer per scope in MongoDB (`Cart` model). Checkout currently uses static UI; order creation from cart is not wired in this codebase.

---

## 2. Add to Cart (Product Details Page)

### 2.1 Entry point

- **Page**: Product details (e.g. `/products/:slug` or store product page).
- **UI**: “Add to cart” button (`#addToCartBtn`) with `data-product-id`, optional `data-store-id`, and `data-scope-type`.

### 2.2 Client flow

1. **Click “Add to cart”**
   - **Auth check**: If no `customerToken` in `localStorage`, redirect to  
     `/customers/sign-in?redirect=<current path>` and stop.
   - **Read form**:
     - Quantity: `[data-product-details] [data-quantity] input` (default 1).
     - Color: `[data-product-color-variants] [data-variant].active` → `data-variant`.
     - Size: `[data-product-size-select]` → `value`.
   - **Build body**:
     - `productId`, `quantity` (min 1), optional `options: { color, size }`.
     - If `scopeType === 'store'` and `storeId` present: add `storeId` to body.
   - **Request**: `POST /api/customers/cart/items`  
     - Headers: `Content-Type: application/json`, `Authorization: Bearer <customerToken>`  
     - Body: JSON as above.
   - **UI**: Disable button and show loading; on success call `updateCartBadge()` (if defined) and show toast/alert “Added to cart”; on error show error message.

**Reference**: `src/pug/mixins/e-commerce/product-details/Details.pug` (add-to-cart script).

### 2.3 Backend: Add cart item

- **Route**: `POST /api/customers/cart/items`  
  - Middleware: `requireCustomerAuth`, `extractStoreOptional`.  
  - Handler: `cartController.addCartItem`.

**Steps**:

1. **Context**  
   - `getCartContext(req)` → `scopeType` (‘store’ | ‘marketplace’) and `storeId` (if store).  
   - Store context comes from `req.store` (e.g. subdomain/header/query).

2. **Validate input**  
   - Require `productId`.  
   - Load `Product` by id; 404 if missing.  
   - Reject if `!product.isActive`.  
   - If scope is store, ensure `product.store.toString() === storeId`; else 400 “Product does not belong to this store”.

3. **Resolve cart**  
   - `getOrCreateCart(customerId, scopeType, storeId)` — one cart per customer per scope (and per store when scope is store).

4. **Pricing**  
   - `resolveUnitPrice(product, options)` and `resolveUnitOriginalPrice(product, options)` using product (and variant for color/size) list/sale prices.

5. **Match existing line**  
   - Same `product`, same `store`, and same `options` (color/size) → treat as same line.  
   - If match: add `quantity` to existing item and refresh unit prices.  
   - Else: push new cart item with `product`, `store`, `quantity`, `options`, `unitPrice`, `unitOriginalPrice`.

6. **Persist**  
   - `cart.save()`.  
   - Populate `items.product` and `items.store`.  
   - Respond 201 with `serializeCartForResponse(cart)` and message “Item added to cart”.

**References**: `backend/controllers/cartController.js` (`addCartItem`, `getCartContext`, `getOrCreateCart`), `backend/routes/customers.js`.

---

## 3. Cart Page

### 3.1 Reaching the cart

- **URL**: `/cart` (optional query: `scopeType`, `storeId` when `scopeType=store`).  
- **Route**: `GET /cart` in `customerPages.js` — `extractStoreOptional`, then render `landing/cart` with `cartScopeType`, `cartStoreId`, `store`, `isCustomerStorefront`.  
- **Auth**: Page is available without auth; content switches on client based on token.

### 3.2 Client behavior

1. **On load**  
   - Read `data-cart-scope-type` and `data-cart-store-id` from `[data-cart-page]`.  
   - If no `customerToken`: show “Please sign in to view your cart” and hide cart content.  
   - If token: show cart content and call `loadCart()`.

2. **Load cart**  
   - `GET /api/customers/cart?scopeType=...&storeId=...` (if store) with `Authorization: Bearer <token>`.  
   - On 401: clear token and re-run load (shows sign-in).  
   - On success: `renderCart(json.data)`.

3. **Render cart**  
   - **Table**: For each `cart.items` — image, name, color, size, unit price (with strikethrough original if on sale), quantity controls (+/- and input), line total, remove button.  
   - **Summary**: Items subtotal, discount, subtotal, total (all from current items).  
   - **Proceed to check out**: Button `#cartCheckoutBtn` — in template it links to `#!`; the script does not set `href` to a checkout URL. To complete the flow, this should be set to e.g. `/checkout?scopeType=...&storeId=...` when the cart is rendered.

4. **Quantity update**  
   - +/- or input change → `PATCH /api/customers/cart/items/:itemId` with `{ quantity }`.  
   - On success, re-render cart from response (or reload).

5. **Remove item**  
   - Trash → `DELETE /api/customers/cart/items/:itemId`.  
   - On success, re-render or reload cart.

**References**: `src/pug/apps/e-commerce/landing/cart.pug`, `src/pug/mixins/e-commerce/cart/SummaryCard.pug`, `src/pug/mixins/e-commerce/cart/CartTable.pug` (structure); cart API in `cartController.js`.

---

## 4. Cart API Summary (Current Context)

All under `/api/customers`, with `requireCustomerAuth` and `extractStoreOptional` where applicable:

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/cart` | Get current-context cart (query: `scopeType`, `storeId`) |
| GET | `/cart/items` | Get cart items for dropdown/UI |
| GET | `/carts` | List current-context cart summary (e.g. badge count) |
| POST | `/cart/items` | Add item (body: `productId`, `quantity`, optional `options`, optional `storeId` when store scope) |
| PATCH | `/cart/items/:itemId` | Update quantity (body: `quantity`) |
| DELETE | `/cart/items/:itemId` | Remove item |
| DELETE | `/cart` | Clear current-context cart |

Cart context is derived from `req.store` (store scope) or absence of store (marketplace scope).

---

## 5. Checkout Page

### 5.1 Reaching checkout

- **Intended flow**: User clicks “Proceed to check out” on the cart page. Currently the button href is `#!`; it should be set (e.g. in `renderCart`) to something like `/checkout?scopeType=...&storeId=...` to preserve scope.
- **Checkout page**: Rendered from `src/pug/apps/e-commerce/landing/checkout.pug` (if a route serves it). No `/checkout` route was found in `customerPages.js`; the app may serve it via another router or static build.

### 5.2 Checkout UI (current template)

- **Layout**: Two columns — form (shipping, billing, delivery, payment) and a summary card.
- **Sections** (from `Checkout.pug`):
  - **Shipping details**: Name, address, phone (static placeholder).
  - **Billing**: “Same as shipping” and billing table (static).
  - **Delivery type**: Radio options (e.g. Free, Two days, Standard, One day) with prices and dates (static).
  - **Payment method**: Credit card / PayPal / Coupon, card fields, “Pay $695.20” and “Save Order and Exit” (static).
- **Summary**: `CheckoutSummaryCard` — static list and totals, not bound to the current cart.

So today, checkout is a **static template**: no loading of cart into the summary and no submission that creates an order from the cart.

---

## 6. Order Creation (Backend, Not Wired to Cart)

- **Order model** (`backend/models/order.js`): `store`, `orderNumber`, `orderItems` (refs to `OrderItem`), shipping/billing fields, `customer`, `customerEmail`, `customerName`, `totalPrice`, `subtotal`, `tax`, `shipping`, `discount`, `status`, `paymentStatus`, `paymentMethod`, dates, etc.
- **OrderItem**: `quantity`, `product` (ref).
- **Existing orders API** (`backend/routes/orders.js`): `POST /` creates an order from `req.body.orderItems` (array of `{ product, quantity }`), plus address and other fields. It does **not**:
  - Use the customer’s cart.
  - Enforce customer auth or store scope.
  - Match the Order schema (e.g. `orderNumber`, `store`, `customer`, etc.) used elsewhere.

Customer-facing order listing is implemented: `getCustomerOrders` and profile/order table use `Order.find({ customer })`.

---

## 7. End-to-End Flow Summary (As Implemented vs To Be Wired)

| Step | Implemented | Notes |
|------|-------------|--------|
| 1. Product page – Add to cart | Yes | POST `/api/customers/cart/items` with productId, quantity, options; scope from context. |
| 2. Cart badge / dropdown | Yes | GET `/api/customers/carts` and `/cart/items`; navbar shows count and items. |
| 3. Cart page | Yes | GET `/api/customers/cart`; table + summary; update/remove items. |
| 4. “Proceed to check out” | Partial | Button exists but href is `#!`; should set to `/checkout?scopeType=...&storeId=...` when rendering cart. |
| 5. Checkout page | Template only | Shipping, billing, delivery, payment are static; summary not from cart. |
| 6. Create order from cart | No | No API that reads current cart and creates `Order` + `OrderItem`s; orders route is separate and not cart-driven. |

---

## 8. Suggested Completion of the Flow

To fully connect “add to cart” through “checkout”:

1. **Cart page**  
   In `renderCart()`, set  
   `document.getElementById('cartCheckoutBtn').href = '/checkout?scopeType=' + scopeType + (storeId ? '&storeId=' + storeId : '');`  
   (and optionally hide or disable when `items.length === 0`).

2. **Checkout route**  
   Add e.g. `GET /checkout` in customer pages (with `requireCustomerAuth`, `extractStoreOptional`) that renders `landing/checkout` and passes scope so the page can load the same cart.

3. **Checkout data**  
   On checkout load, call `GET /api/customers/cart?scopeType=...&storeId=...` and populate the summary (and optionally shipping from customer profile/addresses).

4. **Place order API**  
   Add e.g. `POST /api/customers/orders` (or `/checkout/place-order`) that:  
   - Uses `requireCustomerAuth` and cart context.  
   - Loads current cart, creates `OrderItem`s from cart items, generates `orderNumber`, creates `Order` with `customer`, `store` (from cart or first item), totals, and address/payment from request body.  
   - Clears or marks the cart as converted.  
   - Returns the created order (and optionally redirect or confirmation URL).

5. **Checkout form**  
   Wire the “Pay” button to the new place-order API and handle success (e.g. redirect to order confirmation or profile orders).

This document reflects the codebase as of the review; implement the suggestions above to complete the add-to-cart–through–checkout flow.

---

## 9. Alignment with Standard E-Commerce Flow (Reference)

Below, the **reference flow** (Add to Cart → Checkout → Order Confirmation, as used in product docs / QA / engineering handoff) is mapped to **Griffin’s current implementation**. Use this for gap analysis and test-case alignment.

| Ref # | Reference step | Griffin alignment | What Griffin has vs reference |
|-------|----------------|-------------------|--------------------------------|
| **1** | **Product Discovery & Selection** (browse → PDP; images, price, availability, variants, shipping) | **Partial** | PDP exists with images, price, sale price, variants (color/size). No explicit **availability/stock status** or **shipping estimates** on PDP in the flow traced. Product listing (category/search) exists elsewhere. |
| **2** | **Add to Cart** (options, quantity, validate → request → backend validate, inventory, reserve → cart summary → frontend update, next actions) | **Partial** | **Aligns:** Options (color, size), quantity, productId; backend validates product + variant pricing; cart updated; frontend updates badge, toast; nav has “View Cart”. **Missing:** No **inventory check** or **stock reservation** in add-to-cart; no **Variant ID** (Griffin uses product + options). **Next actions:** “View Cart” (dropdown + link); no explicit “Checkout” or “Continue Shopping” on PDP after add (user stays on PDP). |
| **3** | **Cart Review** (line items, subtotal, tax, shipping, promo → update qty, remove, apply promo → recalc → “Proceed to Checkout”) | **Partial** | **Aligns:** Line items (product, variant via options, price, quantity), subtotal, discount display; update quantity and remove; backend returns updated cart. **Missing:** No **estimated tax** or **estimated shipping** on cart page; no **promo code** input or backend apply/recalc. “Proceed to Checkout” button exists but href is `#!` (not wired to checkout URL). |
| **4** | **Checkout Initialization** (auth check → guest or login; checkout session linked to cart; transition to checkout) | **Not implemented** | **Griffin:** Cart and checkout require **logged-in customer** (no guest checkout). No **Checkout Session** entity or API; no dedicated “initialize checkout” step. Transition to checkout would be via “Proceed to Checkout” (once href is set) — no session creation. |
| **5** | **Shipping Information** (enter/select address → validate → verify address → shipping methods → recalc shipping/tax/total) | **Template only** | Checkout page has **static** shipping details (name, address, phone). No form submission, no address validation, no “verify address” service, no **retrieval of shipping methods** or **recalculation** of shipping/tax/total from backend. |
| **6** | **Billing & Payment** (billing address, payment method → tokenize via gateway → token to backend) | **Template only** | Checkout has static billing (“Same as shipping”) and payment UI (card, PayPal, coupon). No **payment gateway integration**, no **tokenization**, no API to “associate payment token with checkout session”. |
| **7** | **Order Review & Confirmation** (review summary → “Place Order”) | **Template only** | Checkout shows a static summary and “Pay” / “Save Order and Exit” buttons. No **live order summary** from cart; no wired “Place Order” that triggers payment and order creation. |
| **8** | **Payment Authorization & Order Creation** (authorize with gateway → on success: deduct inventory, create order, order ID, clear cart) | **Not implemented** | No **payment gateway** call. **Order** model and customer order list exist, but there is **no API that creates an order from the current cart** or clears the cart. Separate `orders.js` POST exists but is not cart-based and does not match the customer/store flow. No **inventory deduction** in this flow. |
| **9** | **Post-Checkout** (redirect to confirmation; order number, summary, delivery; email/SMS, fulfillment, analytics) | **Not implemented** | No **Order Confirmation Page** or redirect after place order. No **order confirmation email/SMS** or **fulfillment workflow** or **analytics events** tied to this flow. Profile “Orders” tab shows existing orders only. |
| **10** | **Exception & Edge Cases** (out-of-stock, price change, payment failure, session expiry, invalid promo, address failure) | **Partial / Missing** | **Session:** 401 on cart API leads to sign-in prompt. **Out-of-stock / price change / payment failure / invalid promo / address failure:** Not handled in the current add-to-cart → checkout flow (no inventory checks, no price-hold, no payment or promo or address APIs). |

### Summary

- **Strong alignment (1–3):** Product selection, add to cart (with variants/quantity), and cart review (line items, subtotal, update/remove) are implemented. Gaps: no inventory or reserve, no tax/shipping/promo on cart, “Proceed to Checkout” not linked.
- **Weak or template-only (4–7):** Checkout initialization, shipping, billing/payment, and order review exist only as static UI; no checkout session, no address/shipping/payment APIs, no “Place Order” from cart.
- **Not implemented (8–10):** Payment authorization, order creation from cart, cart clear, confirmation page, and post-order (email, fulfillment, analytics). Exception handling is minimal (auth only).

### Griffin-specific context

- **Store vs marketplace:** Cart scope (`store` | `marketplace`) and `storeId` are part of the flow; the reference does not assume multi-store. Preserve scope in cart and checkout URLs/APIs.
- **Auth:** Customer-only (no guest checkout); reference allows guest or login.
- **Identifiers:** Griffin uses **productId + options (color, size)** rather than a separate **variant ID** in the cart API.

---

## 10. Step-by-Step Implementation Plan (Standard Process in Griffin)

This plan implements the standard e-commerce flow (Add to Cart → Checkout → Order Confirmation) in Griffin. Steps are ordered by dependency; each phase can be delivered and tested before moving on.

---

### Phase 1 — Wire Cart to Checkout (Minimal path to checkout) ✅ Implemented

**Goal:** User can go from cart to a checkout page that shows their cart. No payment or order creation yet.

| Step | Description | Where / How | Status |
|------|-------------|-------------|--------|
| **1.1** | Set “Proceed to Checkout” href from cart | In `cart.pug` `renderCart()`, after rendering: set `#cartCheckoutBtn.href` to `/checkout?scopeType=...` and `&storeId=...` when store scope. Disable or hide button when `items.length === 0`. | ✅ |
| **1.2** | Add checkout page route | In `backend/routes/customerPages.js`: add `GET /checkout` with `requireCustomerAuth` and `extractStoreOptional`. Render `landing/checkout` with `cartScopeType`, `cartStoreId`, `store` (from query or `req.store`). | ✅ |
| **1.3** | Load cart on checkout page | In checkout page script (add to `checkout.pug` or layout): on load, read scope from URL/`data-*`; call `GET /api/customers/cart?scopeType=...&storeId=...`; populate **CheckoutSummaryCard** with cart items and totals (replace static content). | ✅ |
| **1.4** | “Edit cart” links | In checkout template: “Edit cart” → `/cart?scopeType=...&storeId=...` so user can return to cart without losing scope. | ✅ |

**Exit criteria:** User on cart clicks “Proceed to Checkout” → lands on checkout page with correct cart summary.

---

### Phase 2 — PDP & Add-to-Cart Enhancements (Ref #1–2) ✅ Implemented

**Goal:** Align PDP and add-to-cart with standard flow (availability, next actions; optional inventory).

| Step | Description | Where / How | Status |
|------|-------------|-------------|--------|
| **2.1** | Show availability / stock on PDP | Backend: ensure product (or variant) has a stock/availability field; expose in product API. Frontend: on PDP (`Details.pug` or product-details view), display “In stock” / “Low stock” / “Out of stock” and disable “Add to Cart” when unavailable. | ✅ |
| **2.2** | Optional: shipping estimate on PDP | If desired: add backend endpoint or product metadata for estimated shipping (e.g. by region); display on PDP. Can be deferred. | ⏸ Deferred |
| **2.3** | Add-to-cart next actions (post-add) | After successful add-to-cart: show toast/modal with “View Cart” and “Checkout” (and optionally “Continue Shopping”). Reuse existing cart/checkout URLs with scope from page (`data-scope-type`, `data-store-id`). | ✅ |
| **2.4** | Backend: inventory check on add-to-cart | In `cartController.addCartItem`: after loading product, check inventory (product or variant level). If quantity requested exceeds available, return 400 with clear message or return max allowed. Optionally reserve stock (soft reserve with TTL) in a later phase. | ✅ |

**Exit criteria:** PDP shows availability; add-to-cart validates inventory; user sees “View Cart” / “Checkout” after add.

**Implementation notes:** PDP disables Add to Cart when `displayCountInStock === 0` (initial disabled for base product when no variants; script updates on variant change). Post-add modal (`#addToCartModal`) with View Cart, Checkout, Continue Shopping; links use `scopeType` and `storeId`. Backend `getAvailableStock(product, options)` uses product or matching variant `countInStock`; add-to-cart returns 400 with “Only X available” when total (existing in cart + requested) exceeds available.

---

### Phase 3 — Cart Page Enhancements (Ref #3) ✅ Implemented

**Goal:** Cart shows estimated tax, shipping, and promo; “Proceed to Checkout” already wired (Phase 1).

| Step | Description | Where / How | Status |
|------|-------------|-------------|--------|
| **3.1** | Promo/coupon model and API | Backend: add Promotion/Coupon model (code, type, value, min order, valid range, usage limits). Endpoints: validate promo (POST e.g. `/api/customers/cart/promo` with `{ code }`), apply to cart, recalc; remove promo. Store applied promo on cart or in session. | ✅ |
| **3.2** | Cart: apply promo and recalc | Backend: when returning cart, compute discount from applied promo; include in cart response. Frontend: promo input + “Apply” calls POST `/cart/promo`; “Remove” calls DELETE `/cart/promo`; on success re-render cart with subtotal/discount/tax/shipping/total. | ✅ |
| **3.3** | Estimated tax and shipping on cart | Backend: tax rate from **store** (`Store.settings.taxRate`); if not defined, use default (env `DEFAULT_TAX_RATE` or 0). Shipping estimate = 0 on cart (calculated at checkout). Cart response includes `subtotal`, `promoDiscount`, `estimatedTax`, `estimatedShipping`, `total`. Frontend: display in summary; total = subtotal − discount + tax + shipping. | ✅ |
| **3.4** | Persist scope in cart summary | Cart context uses query `scopeType`/`storeId` when present; all cart API calls (GET, PATCH, DELETE, promo) send scope so store-scoped cart is correct. “Proceed to Checkout” and summary use same scope from page `data-*`. | ✅ |

**Exit criteria:** User can apply promo and see discount; cart shows estimated tax and shipping and correct total.

**Implementation notes:** Promotion model: `code`, `type` (percentage/fixed), `value`, `minOrder`, `validFrom`/`validTo`, `usageLimit`/`usedCount`, `store` (null = marketplace-wide). Cart has `appliedPromoCode`. Tax from store: store cart uses that store’s `settings.taxRate`; marketplace cart uses first item’s store tax rate; default when not set: `DEFAULT_TAX_RATE` (env, or 0). Promo apply/remove: `POST /api/customers/cart/promo` (body `{ code }`), `DELETE /api/customers/cart/promo`; include `scopeType` and `storeId` in query for store cart.

---

### Phase 4 — Checkout Initialization & Shipping (Ref #4–5) ✅ Implemented

**Goal:** Checkout has real shipping address and shipping methods; totals update when shipping is selected.

| Step | Description | Where / How | Status |
|------|-------------|-------------|--------|
| **4.1** | Checkout “session” (optional) | Option A: Keep checkout stateless: cart + scope is the source of truth; no separate CheckoutSession. Option B: Add CheckoutSession model (cart ref, customer, addresses, shipping method, totals snapshot) and “initialize checkout” API that creates/returns it. Prefer A for simplicity unless you need hold/lock. | ✅ (stateless) |
| **4.2** | Shipping address: load and edit | Backend: customer addresses already exist (`/api/customers/profile` returns addresses). Checkout page: load profile; “Saved address” dropdown + form fields (address1, address2, city, zip, country, phone). On select address fill form; on place order send address in body. | ✅ |
| **4.3** | Address validation (optional) | Integrate a third-party address verification service; validate on blur or on “Continue”. Return normalized address and validation result. Can be Phase 4.5 or later. | ⏸ Deferred |
| **4.4** | Shipping methods API | Backend: `GET /api/customers/checkout/shipping-methods` (query: scopeType, storeId). Returns list of methods (id, name, price, estimatedDays). Use store/marketplace context. | ✅ |
| **4.5** | Checkout UI: shipping method selection | Frontend: on load call shipping-methods API; render radios in `#checkout-shipping-methods`. On select: update `selectedShippingCost` and summary (shipping + total). | ✅ |
| **4.6** | Recalc tax when address/shipping changes | If tax depends on address or shipping, recalc tax and total whenever address or shipping method changes; return updated totals from backend or compute on frontend from rules. | ✅ (total = subtotal + shipping; tax 0) |

**Exit criteria:** User can set/select shipping address and shipping method; checkout summary shows correct shipping and total.

**Implementation notes:** Shipping address from profile dropdown or manual form; place order accepts `shippingAddress1`, `shippingAddress2`, `city`, `zip`, `country`, `phone`, `shippingMethodId`, `shippingCost`. Order total includes shipping; `order.shipping` stored.

---

### Phase 5 — Billing & Payment Integration (Ref #6) ✅ Implemented

**Goal:** User can enter payment method; frontend tokenizes with gateway; backend receives token and associates with checkout.

| Step | Description | Where / How | Status |
|------|-------------|-------------|--------|
| **5.1** | Choose payment gateway | Pick provider (e.g. Stripe, Braintree, PayPal). Implement server-side SDK; never store raw card data. Use gateway’s hosted fields or Elements for PCI-safe tokenization. | ✅ |
| **5.2** | Billing address | Reuse “Same as shipping” and optional separate billing fields. Send billing address with payment intent if required by gateway. | ✅ |
| **5.3** | Frontend: tokenize payment | On checkout page: load gateway JS; user fills card (or selects saved method if you add it). On “Place Order”, create token or PaymentMethod via gateway; send only token/id to your backend. | ✅ |
| **5.4** | Backend: accept payment token | New endpoint e.g. `POST /api/customers/checkout/place-order` (or split into “attach payment” + “confirm”). Accept payment token, billing details, shipping address, shipping method. Validate cart and totals; associate token with order creation in Phase 6. Do not charge yet if you do auth+capture in one step in Phase 6. | ✅ |

**Exit criteria:** User can enter payment; frontend sends token to backend; backend accepts and stores token for next phase.

**Implementation notes:** Set `STRIPE_PUBLISHABLE_KEY` in env to enable card payment; Order model has `stripePaymentMethodId`. To charge cards, add `stripe` package, set `STRIPE_SECRET_KEY`, and in Phase 6.2 call Stripe to confirm/capture the PaymentMethod.

---

### Phase 6 — Order Creation & Payment Authorization (Ref #7–8) ✅ Implemented

**Goal:** “Place Order” creates order from cart, authorizes payment, clears cart, and redirects to confirmation.

| Step | Description | Where / How | Status |
|------|-------------|-------------|--------|
| **6.1** | Order creation from cart API | In place-order handler (or dedicated service): load current cart by scope; validate items still exist and prices match (or apply price-change policy). Create one Order per store if marketplace (or one order; depends on product design). For each order: generate `orderNumber`, create OrderItems from cart items (product, quantity, unit price, options), set totals (subtotal, discount, tax, shipping), set customer, store, addresses, shipping method, payment method. Save Order; get order id(s). | ✅ |
| **6.2** | Payment authorization | After creating order record(s): call gateway to authorize (and optionally capture) using stored token. If auth fails: do not clear cart; return error to frontend; optionally mark order as “payment failed” for support. | ⏸ Stubbed (order created with paymentStatus: 'paid'; no gateway yet) |
| **6.3** | Inventory deduction | After successful payment: for each order item, decrement product/variant stock. Handle oversell: if stock goes negative, either reject before charge or implement oversell policy and backorder flow. | ✅ |
| **6.4** | Clear (or archive) cart | After successful order: clear cart items for the scope used, or move cart to “archived” so user sees empty cart. Respond with order id(s) and confirmation URL. | ✅ |
| **6.5** | Frontend: “Place Order” and redirect | “Place Order” sends final payload (payment token, address, shipping method, etc.) to place-order API. On success: redirect to Order Confirmation page (e.g. `/orders/confirmation/:orderId` or first order id for multi-store). On failure: show error (payment failed, out of stock, etc.). | ✅ |
| **6.6** | Order totals and idempotency | Ensure place-order uses same totals as shown on review (from cart + shipping + tax + promo). Consider idempotency key (e.g. cart id + timestamp window) to avoid duplicate charges on retry. | ✅ (totals from cart; idempotency can be added later) |

**Exit criteria:** Place Order creates order(s), charges customer, deducts inventory, clears cart, and redirects to confirmation.

**Implementation notes:** `POST /api/customers/orders` (body: `scopeType`, `storeId` when store, optional `paymentMethod`); shipping address from body or customer default address. One order per store; `OrderItem` has `unitPrice`; confirmation route `GET /orders/confirmation/:orderId`.

---

### Phase 7 — Post-Checkout (Ref #9) ✅ Implemented

**Goal:** Confirmation page and basic post-order automation.

| Step | Description | Where / How | Status |
|------|-------------|-------------|--------|
| **7.1** | Order Confirmation Page | New route e.g. `GET /orders/confirmation/:orderId` (with `requireCustomerAuth`; verify order belongs to customer). Render page with order number, line items, shipping address, payment method, total, status. Link “View order” to profile orders or order detail. | ✅ |
| **7.2** | Order confirmation email | Backend: after successful order, trigger email (nodemailer, SendGrid, etc.) with order summary, delivery estimate, and link to order/account. Use template with order number, items, total. | ✅ |
| **7.3** | Optional: SMS and fulfillment | Add SMS notification (e.g. Twilio) if required. Fulfillment: either manual or integrate with warehouse/shipping provider; update order status (e.g. “Shipped” with tracking). Can be a later phase. | ⏸ Deferred |
| **7.4** | Analytics and tracking | Fire events (e.g. order placed, value) to your analytics (GA4, Mixpanel, etc.). Optionally send to payment gateway for conversion tracking. | ✅ |

**Exit criteria:** User sees confirmation page; receives confirmation email; analytics receives order-placed event.

**Implementation notes:** Confirmation page shows order number, status, payment method, shipping address, line items table (product, qty, price, total), and total; links “View my orders” (profile) and “Continue shopping”. Email: `backend/services/orderConfirmationEmail.js` sends HTML confirmation when SMTP is configured (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`); uses `nodemailer`. Analytics: confirmation page pushes `purchase` event to `window.dataLayer` and calls `window.gtag('event', 'purchase', …)` when present (GA4/compatible).

---

### Phase 8 — Exception & Edge Cases (Ref #10) ✅ Implemented

**Goal:** Handle out-of-stock, price change, payment failure, session expiry, promo, and address errors.

| Step | Description | Where / How | Status |
|------|-------------|-------------|--------|
| **8.1** | Out-of-stock during checkout | On place-order: re-check inventory; if any item no longer available, return 409 with message and list of unavailable items. Frontend: show message and redirect to cart. | ✅ |
| **8.2** | Price changes before payment | Option A: On place-order, recalc prices from current product/variant; if different from cart, return 409 with message. Frontend: show message and redirect to cart. | ✅ |
| **8.3** | Payment failure or timeout | Backend: on any place-order error (before creating orders), do not clear cart. Frontend: show error and allow retry. Cart is only cleared after successful order creation. | ✅ |
| **8.4** | Session expiration | Cart and checkout API calls handle 401: redirect to sign-in with `redirect=/cart?...` or `redirect=/checkout?...` so user returns after login. | ✅ |
| **8.5** | Invalid or expired promo | Validate promo on apply and again on place-order. If invalid on place-order: clear `cart.appliedPromoCode`, save cart, return 400 with `promoRemoved: true`. Frontend: show message and redirect to cart. | ✅ |
| **8.6** | Address validation failure | If using address verification: on failure, show message and do not proceed. | ⏸ Deferred (Phase 4.3) |

**Exit criteria:** Documented behavior for each case; QA can verify with tests.

**Implementation notes:** Place-order runs inventory check (getAvailableStock per item with variants) and price check (resolveCurrentUnitPrice vs cart unitPrice) before creating orders; 409 with `code: 'OUT_OF_STOCK'` and `unavailableItems` or `code: 'PRICE_CHANGED'`. Invalid promo on place-order: cart promo cleared, 400 with `code: 'PROMO_INVALID'`, `promoRemoved: true`. Checkout frontend: 401 → redirect to sign-in with current URL; 409/400 cart-related → alert and redirect to cart. Cart page: 401 → redirect to sign-in with `/cart?scopeType=...&storeId=...`.

---

### Implementation Order Summary

| Phase | Focus | Depends on |
|-------|--------|------------|
| **1** | Cart → Checkout link, checkout route, load cart on checkout | — |
| **2** | PDP availability, add-to-cart next actions, optional inventory check | — |
| **3** | Promo, estimated tax/shipping on cart | — |
| **4** | Shipping address and methods on checkout | 1 |
| **5** | Payment gateway and tokenization | 1 |
| **6** | Place order from cart, payment auth, inventory, clear cart | 1, 4, 5 |
| **7** | Confirmation page, email, analytics | 6 |
| **8** | Edge cases and error handling | 2, 3, 4, 5, 6 |

**Suggested sequence:** Do **Phase 1** first (minimal path to checkout). Then **Phase 6** (order creation + payment) with minimal shipping (e.g. single default method and address from profile) so you have an end-to-end flow. Add **Phase 4** (shipping methods) and **Phase 5** (payment UI) in parallel or next. Then **Phase 2**, **3**, **7**, and **8** to reach full alignment with the standard process.
