# Product delete semantics

This document describes how product deletion works in the admin: **soft delete** (default) vs **hard delete**, and how the admin UI copy matches that behaviour.

## Behaviour

### Soft delete (default)

- **Endpoint:** `DELETE /api/admin/products/:id`
- **Behaviour:** Sets `isDeleted: true` on the product. The product remains in the database but is hidden from:
  - Admin product list
  - Storefront (category pages, homepage, product detail page returns 404)
  - Related/similar products
  - Product count and featured product queries
- **Use case:** “Remove from catalog” — product disappears from the store but can be restored later (e.g. by setting `isDeleted: false` via a future “Restore” action or direct DB/script).
- **Admin UI:** The products list “Delete” action uses this endpoint. The copy is aligned with soft delete: **“Remove from catalog”** with confirmation and success messages that state the product can be restored.

### Hard delete (permanent)

- **Endpoint:** `DELETE /api/admin/products/delete/:id`
- **Behaviour:** Permanently removes the product document from the database and deletes the main product image from Cloudinary (if present). No undo.
- **Use case:** When an admin explicitly wants to erase a product (e.g. test data, compliance). Not exposed by the default products list button; can be used by API or a dedicated “Permanently delete” flow (e.g. from an edit page or trash view).

## Schema

- **`isDeleted`** on the product schema: `{ type: Boolean, default: false }`. Soft delete sets this to `true`. All listing and storefront queries exclude products where `isDeleted === true` (e.g. `isDeleted: { $ne: true }`).

## Admin copy

- **List action:** “Remove from catalog” (not “Delete”) so it’s clear the product is hidden, not permanently removed.
- **Confirm:** e.g. “Remove this product from the catalog? It will be hidden from the store and can be restored later.”
- **Success:** e.g. “Product removed from catalog.”
- A separate “Permanently delete” (if added later) would call the hard-delete endpoint and use copy that clearly states the action is irreversible.

## References

- `backend/models/products/baseProduct.js` — `isDeleted` field.
- `backend/services/admin/adminProductsService.js` — `removeProductSoft`, `deleteProductHard`.
- `backend/routes/adminRoutes/products.js` — `DELETE /products/:id` (soft), `DELETE /products/delete/:id` (hard).
- `backend/helpers/productHelpers.js` — `buildProductFilter` (excludes `isDeleted`).
