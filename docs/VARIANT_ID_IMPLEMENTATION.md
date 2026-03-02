# Variant ID Implementation

## Summary

This document describes the implementation of stable variant identifiers in Griffin, enabling proper cart/order references and variant-level inventory tracking.

## Changes

### 1. Variant schemas (all product types)

**Removed** `{ _id: false }` from variant subdocument schemas so each variant gets a MongoDB `_id` on save.

**Files:**  
`backend/models/products/clothing.js`, `electronics.js`, `food.js`, `furniture.js`, `books.js`, `healthBeauty.js`, `homeGarden.js`, `sports.js`

### 2. Cart schema

**Added** `variantId` to cart items:

```javascript
variantId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
}
```

- `null` when the product has no variants or the variant has no `_id` yet
- Stored when adding to cart so the same variant is matched on subsequent adds

### 3. Order item schema

**Added** `variantId` and `options`:

```javascript
variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
options: {
    color: { type: String },
    size: { type: String }
}
```

- `variantId`: Stable reference for returns, refunds, inventory, analytics
- `options`: Display info for order history and emails

### 4. Helper: `variantHelpers.js`

- `findVariantByOptions(product, options)` → `{ variant, variantId } | null`
- `findVariantById(product, variantId)` → variant object or null

### 5. Cart controller

- Resolves `variantId` from options when adding to cart
- Matches items by `variantId` when both item and new add have it
- Falls back to options matching for older cart items
- Backfills `variantId` on existing cart items when merging quantities

### 6. Checkout controller

- Saves `variantId` and `options` on order items
- Inventory deduction:
  - With variant: updates `variants.$[elem].countInStock` via `arrayFilters`
  - Without `_id` (legacy): updates by array index
  - No variant: updates base `countInStock`

### 7. Display updates

- Order confirmation page: shows options (e.g. `Blue T-Shirt (M, Blue)`)
- Order confirmation email: same format

### 8. Migration script

`backend/scripts/migrate-variant-ids.js` adds `_id` to existing variants by saving each product with variants.

**Usage:**
```bash
node backend/scripts/migrate-variant-ids.js
```

## Backward compatibility

| Scenario | Behavior |
|----------|----------|
| Cart items without `variantId` | Matching and inventory use options fallback |
| Variants without `_id` | Inventory update by index; options matching for cart |
| Existing orders | No change; new orders include `variantId` and `options` |

## Rule of thumb

- **Do not** use separate product documents per variant unless you need separate URLs or fully independent products.
- **Do** use a stable variant identifier (`variantId` or `_id`) whenever carts, orders, returns, or inventory reference specific variants.
