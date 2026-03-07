# Product Types Validation

This document describes how product type configuration (predefined and custom) is validated so that **misconfiguration yields clear 4xx responses**, not runtime crashes (5xx or uncaught exceptions).

## Behaviour

- **Invalid or unknown product type**  
  Create/update product and bulk import validate `productType` against the store's allowed types (`getAllowedProductTypesForStore`). Invalid type returns **400** with a message like: `Invalid product type. Must be one of: …`.

- **Invalid product type configuration**  
  - `createProductSpecificData` (in `backend/helpers/productHelpers.js`) resolves config via `getProductTypeConfig` / `getProductTypeConfigWithCustom`. If config is missing or `config.fields` is missing or not an object, it **throws a clear `Error`** (e.g. "Invalid product type" or "Product type has invalid configuration (missing or invalid fields)"). Callers should catch and return **400** with the error message.
  - `getProductTypeConfigWithCustom` (in `backend/config/productTypes.js`) normalises custom type config so `config.fields` is always an object (defaulting to `{}` when missing), avoiding crashes in code that assumes `config.fields` exists.
  - `getAllProductTypesWithCustom` filters out any custom type whose `toProductTypeConfig()` returns a config without a valid `fields` object, so the admin product-types API never exposes broken config.

- **Predefined types**  
  `backend/config/productTypes.js` runs `validateProductTypeConfig()` at load time; invalid predefined types cause startup failure with a clear message, not a runtime 500 during a request.

## Callers

- **Admin product create/update** (`adminProductsService.createProduct` / `updateProduct`): use `validateProductTypeForStore` and allowed-types checks; invalid type → **400**.
- **Bulk import**: same allowed-types validation; invalid type per row can be reported in import results (e.g. validation error row).
- **Product type config API** (`GET /admin/.../product-types/config`): returns only valid configs; custom types with invalid config are filtered out. Unexpected errors (e.g. DB) remain **500**.

## References

- `backend/config/productTypes.js` — predefined types, `getProductTypeConfigWithCustom`, `getAllProductTypesWithCustom`.
- `backend/helpers/productHelpers.js` — `createProductSpecificData`, `validateProductTypeForStore`, `getAllowedProductTypesForStore`.
- `docs/BULK_PRODUCT_IMPORT_ARCHITECTURE.md` — import validation and error handling.
