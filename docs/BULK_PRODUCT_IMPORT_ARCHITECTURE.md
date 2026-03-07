# Bulk Product Import from CSV — Architecture & Implementation Guide

This document provides a complete architecture and step-by-step implementation guide for adding bulk product creation from CSV files to the Griffin e-commerce platform.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Flow](#3-data-flow)
4. [File Structure](#4-file-structure)
5. [CSV Format Specification](#5-csv-format-specification)
6. [Step-by-Step Implementation](#6-step-by-step-implementation)
7. [API Reference](#7-api-reference)
8. [Testing Strategy](#8-testing-strategy)
9. [Edge Cases & Error Handling](#9-edge-cases--error-handling)

---

## 1. Overview

### Goal
Enable admins to create multiple products at once by uploading a CSV file instead of filling out the add-product form for each item.

### Scope
- **Backend**: New route, service, validator, and CSV parsing logic
- **Frontend**: Import page, upload UI, results display, downloadable template
- **Reuse**: Leverage existing `createProduct` validation, `productTypeModelMap`, category/vendor resolution

### Out of Scope (Phase 1)
- Image upload from URLs in CSV (can be added later)
- Background job queue for very large files (1000+ rows)
- Column mapping UI (fixed column names for Phase 1)

### Related documentation
- [VARIANT_ID_IMPLEMENTATION.md](./VARIANT_ID_IMPLEMENTATION.md) — Variants have `_id` for cart/order/inventory; bulk import must not include `_id` in CSV (MongoDB assigns on save).

---

## 2. Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Products List Page          Import Page (new)        Template Download      │
│  [Add product] [Import]  →   [Drop CSV / Browse]  →   [Download template]    │
│                                    │                         │               │
│                                    └─────────────────────────┘               │
│                                              │                               │
│                                    POST /admin/products/import               │
│                                    (multipart/form-data, file: csv)          │
└─────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Route Layer                                                                 │
│  POST /admin/products/import                                                 │
│  • requireAuth, requirePermission('product:create')                          │
│  • checkUserStores, extractStore, requireStoreAccess                         │
│  • upload.single('csv') (multer)                                             │
│  • validateBulkImport                                                        │
│  • bulkImportProducts (controller)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Service Layer                                                               │
│  adminProductsService.bulkImportProducts({ req, file })                      │
│  • Parse CSV (csv-parse)                                                     │
│  • For each row:                                                             │
│    - Map CSV columns → product fields (including variants)                   │
│    - Resolve category (name or ID) → ObjectId                                │
│    - Resolve vendor (name or ID) → ObjectId                                  │
│    - Parse variants (JSON or simple format)                                  │
│    - Reuse createProduct validation logic                                    │
│    - initProductFields, ProductModel.save()                                  │
│  • Return { created, failed, errors }                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Shared Layer                                                                │
│  • productHelpers: parseField, initProductFields, productTypeModelMap        │
│  • csvProductMapper: mapCsvRowToProductData, parseVariants                   │
│  • categoryRepository.findOneForStoreByName                                  │
│  • vendorRepository.findOneForStoreByName (new)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Route** | Auth, RBAC, store isolation, multer for CSV upload |
| **Validator** | File type (.csv), size (5MB max, `backend/config/importLimits.js`), max data rows (500), presence |
| **Controller** | Call service, return JSON with results |
| **Service** | Parse CSV, validate each row, create products, aggregate results |
| **Helper** | `csvProductMapper` – map raw row to product payload, parse variants (JSON or simple format) |
| **Repository** | `vendorRepository.findOneForStoreByName` (add) |

---

## 3. Data Flow

```
CSV File (multipart)
        │
        ▼
┌───────────────────┐
│ Multer (memory)   │  req.file.buffer
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ csv-parse         │  Parse with options: columns: true, trim: true
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ For each row      │
│ 1. Map columns    │
│ 2. Resolve refs   │  category names/IDs → ObjectIds
│                   │  vendor names/IDs → ObjectIds
│ 3. Validate       │  productType, required fields, compatibility
│ 4. Create         │  ProductModel(productData).save()
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Aggregate result  │  { created: N, failed: M, errors: [...] }
└───────────────────┘
```

---

## 4. File Structure

### New Files

```
backend/
├── routes/adminRoutes/
│   └── products.js                    # Add import route
├── controllers/adminControllers/
│   └── products.js                    # Add bulkImportProducts controller
├── services/admin/
│   └── adminProductsService.js        # Add bulkImportProducts service
├── validators/admin/
│   └── productsValidators.js          # Add validateBulkImport
├── helpers/
│   └── csvProductMapper.js            # NEW: CSV row → product data
└── utils/
    └── csvProductTemplate.js          # NEW: Generate template CSV

src/pug/
└── apps/e-commerce/admin/
    ├── products.pug                   # Add "Import" button
    └── products-import.pug            # NEW: Import page + results

public/
└── templates/
    └── product-import-template.csv    # NEW: Static template (optional)
```

### Modified Files

| File | Changes |
|------|---------|
| `backend/routes/adminRoutes/products.js` | Add `POST /products/import` route |
| `backend/controllers/adminControllers/products.js` | Add `bulkImportProducts` export |
| `backend/services/admin/adminProductsService.js` | Add `bulkImportProducts` function |
| `backend/validators/admin/productsValidators.js` | Add `validateBulkImport` |
| `backend/repositories/admin/vendorRepository.js` | Add `findOneForStoreByName` |
| `src/pug/apps/e-commerce/admin/products.pug` | Add "Import" button |
| `package.json` | Add `csv-parse` dependency |

---

## 5. CSV Format Specification

### Required Columns

| Column | Type | Description |
|--------|------|-------------|
| `name` | string | Product name (required) |
| `description` | string | Product description (required) |
| `productType` | string | One of: Clothing, Electronics, Furniture, Books, Food, Sports, HomeGarden, HealthBeauty |

### Optional Columns (Base Product)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `price` | number | 0 | Base price |
| `salePrice` | number | 0 | Sale price |
| `countInStock` | number | 0 | Stock quantity |
| `brand` | string | '' | Brand name |
| `tags` | string | - | Pipe-separated: `tag1\|tag2\|tag3` |
| `category` | string | - | Category name or ID (comma-separated for multiple) |
| `vendor` | string | - | Vendor name or ID |
| `isActive` | boolean | true | `true` or `false` |
| `isFeatured` | boolean | false | `true` or `false` |
| `metaTitle` | string | - | SEO title |
| `metaDescription` | string | - | SEO description |
| `variants` | string | - | Product variants — see [Variants](#variants) below |

### Variants

Products can have multiple variants (e.g. sizes, colors) with per-variant price, sale price, SKU, and stock. Variants are supported via the `variants` column.

**Per-variant fields (all optional):** `size`, `color`, `colorHex`, `price`, `salePrice`, `sku`, `countInStock`

**Variant `_id`:** Each variant receives a MongoDB `_id` when the product is saved. Do **not** include `_id` in CSV variant data — it is auto-assigned. If present in JSON, the mapper should strip it to avoid conflicts. See [VARIANT_ID_IMPLEMENTATION.md](./VARIANT_ID_IMPLEMENTATION.md) for how variant IDs are used (cart, orders, inventory).

**Two formats are supported:**

#### Format 1: JSON (Phase 1, recommended)

Store the full variants array as JSON. Matches `createProduct` and `parseField` behavior.

```csv
variants
"[{""size"":""S"",""color"":""Blue"",""price"":29.99,""salePrice"":24.99,""sku"":""TSH-BL-S"",""countInStock"":10},{""size"":""M"",""color"":""Blue"",""price"":29.99,""sku"":""TSH-BL-M"",""countInStock"":15}]"
```

- **Excel/Sheets:** Use `""` for each quote inside the string
- **Pros:** Full flexibility, works with existing `parseField` logic
- **Cons:** Tedious to edit manually

#### Format 2: Simple text (Phase 2, optional)

Easier to edit in spreadsheets. Parser converts to variant objects.

**Syntax:** `size:color:price:salePrice:sku:stock` — multiple variants separated by `||`

- Empty fields allowed (use `::` for missing values)
- `||` = variant separator, `:` = field separator

```csv
variants
"S:Blue:29.99:24.99:TSH-BL-S:10||M:Blue:29.99::TSH-BL-M:15||L:Red:29.99::TSH-RD-L:20"
```

Order: `size` | `color` | `price` | `salePrice` | `sku` | `countInStock`

**Mapper logic:** If `variants` starts with `[` (JSON array), use `parseField`. Otherwise parse as simple format and build variant objects.

**Base price vs variants:** If variants have prices, base `price`/`salePrice`/`countInStock` can be 0 or omitted. If no variants, base fields apply.

### Type-Specific Columns (Optional)

| Product Type | Columns |
|--------------|---------|
| Clothing | material, materialComposition (JSON), care (pipe-separated), fit, season, gender |
| Electronics | modelNumber, specifications (JSON), warranty, dimensions (JSON), weight |
| Furniture | dimensions (JSON), weight, material (pipe-separated), isAssembly, style, roomType (pipe-separated), warranty |
| Books | author, publisher, isbn, language, format, genre (pipe-separated), pages, publicationDate |
| Food | ingredients (pipe-separated), nutritionalInfo (JSON), expiryDate, allergens (pipe-separated) |
| Sports | sport, skillLevel, material, weight |
| HomeGarden | room, material, dimensions (JSON) |
| HealthBeauty | brand, skinType, ingredients (pipe-separated), volume (JSON), expiryDate |

### Array/JSON Encoding

- **Pipe-separated**: `tag1|tag2|tag3` for simple arrays
- **JSON**: For objects or complex arrays, e.g. `{"key":"value"}` — must be valid JSON in cell
- **Multiple categories**: Comma-separated names or IDs: `Electronics, Gadgets`
- **Variants**: JSON array or simple format — see [Variants](#variants) above

### Example CSV

**Without variants (base product only):**

```csv
name,description,productType,price,salePrice,countInStock,brand,tags,category,vendor
"Blue T-Shirt","Cotton t-shirt in blue","Clothing",29.99,24.99,100,Acme,"summer|cotton|casual",Men's Apparel,
"Wireless Mouse","Ergonomic wireless mouse","Electronics",49.99,,50,TechCo,"office|wireless",Electronics,TechVendor
"Oak Desk","Solid oak writing desk","Furniture",299.99,249.99,10,,,"Furniture|Home Office",,
```

**With variants (JSON format):**

```csv
name,description,productType,price,variants
"Blue T-Shirt","Cotton t-shirt","Clothing",29.99,"[{""size"":""S"",""color"":""Blue"",""price"":29.99,""countInStock"":10},{""size"":""M"",""color"":""Blue"",""price"":29.99,""countInStock"":15}]"
```

**With variants (simple format, Phase 2):**

```csv
name,description,productType,variants
"Blue T-Shirt","Cotton t-shirt","Clothing","S:Blue:29.99:24.99:TSH-BL-S:10||M:Blue:29.99::TSH-BL-M:15"
```

---

## 6. Step-by-Step Implementation

### Phase 1: Backend Foundation

#### Step 1.1: Install csv-parse

```bash
npm install csv-parse
```

#### Step 1.2: Add vendor repository method

**File:** `backend/repositories/admin/vendorRepository.js`

Add:

```javascript
async function findOneForStoreByName(storeId, name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return Vendor.findOne({ store: toObjectId(storeId), name: trimmed });
}
```

Export in `module.exports`.

#### Step 1.3: Create CSV product mapper helper

**File:** `backend/helpers/csvProductMapper.js` (NEW)

Responsibilities:
- Map CSV row keys (case-insensitive) to product fields
- Parse pipe-separated strings to arrays
- Parse JSON strings where needed
- **Parse variants** (JSON or simple format) → array of variant objects
- Return plain object suitable for `createProduct`-style processing

Key function signature:
```javascript
/**
 * @param {Object} row - CSV row (key-value from csv-parse with columns: true)
 * @param {ObjectId} storeId - Store ID
 * @returns {Object} - Mapped product data for creation
 */
function mapCsvRowToProductData(row, storeId) { ... }
```

Include:
- `parsePipeSeparated(val)` → array
- `parseBoolean(val)` → boolean
- `parseNumber(val)` → number or null
- `parseVariants(val)` → array of `{ size, color, colorHex, price, salePrice, sku, countInStock }` or undefined
  - If value starts with `[` → JSON parse (use `parseField`)
  - Else if value contains `||` → parse simple format: `size:color:price:salePrice:sku:stock` per block
  - **Strip `_id`** from each variant object — MongoDB assigns `_id` on save; CSV must not provide it
  - Convert Decimal128 where needed (or let Mongoose handle on save)
- Normalize column names (trim, lowercase for lookup)

#### Step 1.4: Create bulk import service

**File:** `backend/services/admin/adminProductsService.js`

Add:

```javascript
async function bulkImportProducts({ req, file }) {
  // 1. Resolve storeId via resolveStoreId(req, {})
  // 2. Parse CSV from file.buffer using csv-parse
  // 3. Pre-fetch categories and vendors for store (for name→ID resolution)
  // 4. Loop through rows (skip empty rows):
  //    a. mapCsvRowToProductData(row, storeId)
  //    b. Resolve category: if string, find by name; if looks like ObjectId, use as-is
  //    c. Resolve vendor: same logic
  //    d. Build body matching createProduct shape
  //    e. Call internal createProductFromData(body, storeId) or inline validation + save
  //    f. On success: created++
  //    g. On error: failed++, errors.push({ row: i+2, message, data: row })
  // 5. Return { ok: true, payload: { created, failed, total, errors } }
}
```

Extract shared logic from `createProduct` into `createProductFromData(body, storeId)` if beneficial, or keep validation inline.

#### Step 1.5: Add bulk import validator

**File:** `backend/validators/admin/productsValidators.js`

```javascript
const validateBulkImport = [
  body('store').optional().isMongoId().withMessage('Invalid store ID'),
  // File validation via custom middleware (multer runs first)
  (req, res, next) => {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required. Please upload a .csv file.',
      });
    }
    const ext = (req.file.originalname || '').toLowerCase();
    if (!ext.endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only CSV files are allowed.',
      });
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    next();
  },
  validateRequest,
];
```

#### Step 1.6: Add controller and route

**Controller** (`backend/controllers/adminControllers/products.js`):

```javascript
exports.bulkImportProducts = asyncHandler(async (req, res) => {
  try {
    const result = await adminProductsService.bulkImportProducts({ req, file: req.file });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Error in bulkImportProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error importing products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});
```

**Route** (`backend/routes/adminRoutes/products.js`):

- Use multer with `memoryStorage()` for CSV (no disk write)
- `upload.single('csv')` — field name `csv`
- Add: `router.post('/products/import', requireAuth, requirePermission('product:create'), checkUserStores, extractStore, requireStoreAccess('any'), upload.single('csv'), validateBulkImport, bulkImportProducts);`

Note: Order matters. Multer must run before the validator that checks `req.file`.

---

### Phase 2: Import Service Logic (Detailed)

#### Step 2.1: CSV parsing

```javascript
const { parse } = require('csv-parse/sync');

const records = parse(file.buffer, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true,
  relax_column_count: true,
});
```

#### Step 2.2: Reference resolution

**Category:**
- If value is valid ObjectId → use as-is (verify exists for store)
- Else treat as name → `categoryRepository.findOneForStoreByName(storeId, name)`
- Multiple categories: split by comma, resolve each
- If any fail → add to row errors

**Vendor:**
- Same: ObjectId check or name lookup
- `vendorRepository.findOneForStoreByName(storeId, name)` (new method)

#### Step 2.3: Per-row validation (reuse createProduct rules)

- `productType` required and in allowed list
- `name` and `description` required
- Category–productType compatibility
- Vendor exists if provided

#### Step 2.4: Variant parsing and normalization

- If `variants` present: parse via `parseVariants()` (JSON or simple format)
- **Strip `_id`** from each parsed variant — MongoDB assigns `_id` on save; do not pass through from CSV
- Ensure variant `price`/`salePrice` are numbers (Mongoose will cast to Decimal128)
- Pass `variants` in productData — `initProductFields` initializes `variants: []` if missing; merged productData overrides
- Invalid variant JSON → row fails with "Invalid variants format"

#### Step 2.5: Product creation

Use same flow as `createProduct`:
- `ProductModel = productTypeModelMap[productType] || BaseProduct`
- `initProductFields(productData)`
- `new ProductModel(productData).save()`
- Sanitize HTML on description

---

### Phase 3: Frontend

#### Step 3.1: Add Import button to products list

**File:** `src/pug/apps/e-commerce/admin/products.pug`

Next to "Add product" button (around line 88):

```pug
a.btn.btn-primary#addBtn(href=`/${adminUrl}/products/add`)
  span.fas.fa-plus.me-2
  | Add product
a.btn.btn-phoenix-primary.ms-2(href=`/${adminUrl}/products/import`)
  span.fas.fa-file-import.me-2
  | Import CSV
```

(Adjust `adminUrl` if your layout uses a different variable.)

#### Step 3.2: Create import page route

**File:** `backend/routes/adminRoutes/products.js`

```javascript
router.get('/products/import', requireAuth, requirePermission('product:create'), checkUserStores, extractStore, requireStoreAccess('any'), importProductsPage);
```

**Controller:**

```javascript
exports.importProductsPage = asyncHandler(async (req, res) => {
  try {
    res.render('admin/products-import', {
      pageTitle: 'Import Products',
      api: process.env.API_URL || '/api',
    });
  } catch (error) {
    console.error('Error rendering import page:', error);
    res.status(500).render('admin/error', {
      pageTitle: 'Error',
      message: 'Failed to load import page',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
```

#### Step 3.3: Create import page template

**File:** `src/pug/apps/e-commerce/admin/products-import.pug` (NEW)

Structure:
- Extend `LayoutTheme`
- Breadcrumb: Products → Import
- File drop zone or file input
- "Download template" link
- Submit button
- Results section (hidden initially): created count, failed count, errors table
- Use fetch + FormData for AJAX submit
- Show loading state during upload

Example structure:

```pug
extends ../../../layouts/LayoutTheme
append variables
  - var breadcrumb = [{ label: 'Products', href: `/${adminUrl}/products` }, { label: 'Import', active: true }]
block content
  .mb-9
    h2.mb-4 Import Products from CSV
    .card
      .card-body
        form#importForm
          .mb-3
            label.form-label Upload CSV file
            input.form-control#csvFile(type="file" accept=".csv" required)
          .mb-3
            a.btn.btn-link(href="/templates/product-import-template.csv" download)
              span.fas.fa-download.me-2
              | Download template
          button.btn.btn-primary#submitBtn(type="submit") Import
    #results.card.mt-4.d-none
      .card-body
        h5 Import Results
        #resultsSummary
        #resultsErrors.d-none
```

#### Step 3.4: Add client-side JS for import

In the same pug file or a separate JS include:
- Listen for form submit
- Prevent default, build FormData with file
- POST to `/admin/products/import`
- Parse JSON response, show results
- Display errors in a table (row number, message, optional row data)
- **Download error CSV:** When there are failed rows, show a "Download error CSV" button. On click, the client builds a CSV from the `errors` array (columns: Row, Error Message, Name, Product Type, Category, Vendor) and triggers a download with a filename like `import-errors-YYYYMMDDHHmmss.csv`. No server round-trip; the import response already includes the full `errors` array.

#### Step 3.5: Create downloadable template

**File:** `public/templates/product-import-template.csv` (or generate dynamically)

Provide a route `GET /admin/products/import/template` that returns CSV with headers and 1–2 example rows, or serve the static file from `/templates/product-import-template.csv`.

---

### Phase 4: Polish & Edge Cases

#### Step 4.1: Multer memory storage for CSV

Ensure products route uses memory storage for the import endpoint:

```javascript
const multer = require('multer');
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Only CSV files allowed'), false);
    }
    cb(null, true);
  },
});
```

Use `csvUpload.single('csv')` for the import route.

#### Step 4.2: Duplicate slug handling

Existing slug logic in `baseProductSchema.pre('save')` already ensures unique slugs per store. No extra handling needed.

#### Step 4.3: Empty rows and malformed data

- Skip rows where `name` and `description` are empty
- Log and count as "skipped" if desired, or treat as failed with message "Empty row"

#### Step 4.4: Transaction (optional)

For atomicity, wrap each batch in `mongoose.startSession()` and `session.withTransaction()`. On partial failure, decide whether to commit successful rows or roll back. Phase 1 can skip this and process row-by-row without transactions.

---

## 7. API Reference

### POST /admin/products/import

**Auth:** Required (JWT), permission `product:create`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `csv` (file field) — CSV file
- Optional: `store` (if platform admin selecting store)

**Response (200):**

```json
{
  "success": true,
  "created": 45,
  "failed": 5,
  "total": 50,
  "errors": [
    {
      "row": 12,
      "message": "Invalid product type: UnknownType",
      "data": { "name": "...", "productType": "UnknownType" }
    }
  ]
}
```

Admins can **download a CSV of failed rows** from the import results UI: a "Download error CSV" button appears when `errors.length > 0`. The client builds a CSV with columns Row, Error Message, Name, Product Type, Category, Vendor (from each `errors[].row`, `errors[].message`, and `errors[].data`) and downloads it as `import-errors-<timestamp>.csv`.

**Response (400):**

```json
{
  "success": false,
  "message": "CSV file is required. Please upload a .csv file."
}
```

### GET /admin/products/import/template (Optional)

**Auth:** Required

**Response:** CSV file download with headers and example rows.

---

## 8. Testing Strategy

### Unit Tests

1. **csvProductMapper**
   - Map row with all base fields
   - Parse pipe-separated tags
   - Parse JSON for specifications/dimensions
   - **Parse variants (JSON format)** → array of variant objects
   - **Parse variants (simple format)** → array of variant objects
   - Handle empty and missing fields

2. **bulkImportProducts**
   - Mock CSV buffer, category/vendor lookups
   - Assert created count and error shape
   - Test invalid productType, missing category, etc.

### Integration Tests

1. Upload valid CSV → assert products created in DB
2. Upload CSV with invalid rows → assert partial success and error list
3. Upload CSV with variants (JSON and simple format) → assert variants saved correctly
4. Upload non-CSV → assert 400
5. Upload without auth → assert 401

### Manual Testing

- Small CSV (3–5 rows) with different product types
- CSV with category names vs IDs
- CSV with invalid category/vendor names
- **CSV with variants** (Clothing with sizes/colors, Food with flavors)
- Large CSV (e.g. 100 rows) to verify performance

---

## 9. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Missing name or description | Row fails, add to errors |
| Invalid productType | Row fails |
| Category name not found | Row fails, "Category not found: X" |
| Vendor name not found | Row fails, "Vendor not found: X" |
| Category–productType mismatch | Row fails, compatibility message |
| Store has no subscription / product type not allowed | Row fails |
| Duplicate product names | Allowed; slug will be made unique |
| Empty CSV | Return 0 created, 0 failed |
| CSV with only headers | Return 0 created, 0 failed |
| Malformed CSV (bad quotes, etc.) | Let csv-parse throw; catch and return 400 with message |
| Very long cell content | Rely on existing schema validation |
| BOM in CSV | Use `bom: true` in csv-parse |
| Invalid variants JSON | Row fails, "Invalid variants format" |
| Malformed simple variants format | Row fails or skip invalid variant blocks (document behavior) |
| Variants with non-numeric price/stock | Coerce or fail; prefer fail with clear message |
| Variants with `_id` in CSV | Strip `_id` before save — MongoDB assigns fresh IDs; see [VARIANT_ID_IMPLEMENTATION.md](./VARIANT_ID_IMPLEMENTATION.md) |

---

## Implementation Checklist

- [ ] Install `csv-parse`
- [ ] Add `vendorRepository.findOneForStoreByName`
- [ ] Create `backend/helpers/csvProductMapper.js` (including `parseVariants`)
- [ ] Add `bulkImportProducts` to `adminProductsService.js`
- [ ] Add variant parsing (JSON + optional simple format) to mapper
- [ ] Add `validateBulkImport` to productsValidators
- [ ] Add `bulkImportProducts` and `importProductsPage` to products controller
- [ ] Add routes: `GET /products/import`, `POST /products/import`
- [ ] Configure multer memory storage for CSV
- [ ] Create `products-import.pug` page
- [ ] Add "Import CSV" button to products list
- [ ] Create CSV template file and/or download route (include variants column example)
- [ ] Add client-side form submission and results display
- [ ] Test with sample CSVs (including products with variants)
- [ ] Update Swagger/API docs if applicable

---

## Appendix: csv-parse Options Reference

```javascript
const { parse } = require('csv-parse/sync');

const records = parse(buffer, {
  columns: true,           // First row as keys
  skip_empty_lines: true,
  trim: true,
  bom: true,               // Handle UTF-8 BOM
  relax_column_count: true,// Allow rows with fewer columns
  cast: false,             // Keep as strings; we parse ourselves
});
```
