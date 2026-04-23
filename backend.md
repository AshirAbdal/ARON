# Backend Documentation — Arong Cosmetics

## Overview

The backend is powered by **SQLite via `better-sqlite3`** (synchronous). Both the `Arong` (storefront) and `Admin` apps share a single database file located at:

```
/Users/ashirabdalravee/Arong/db/arong.db
```

Each app has its own `lib/db.ts` that opens the same database file using a relative path (`process.cwd() + '/../db/arong.db'`). The Arong app seeds all initial data on first run. The Admin app mirrors the same schema but does not seed.

---

## Database Configuration

| Setting | Value |
|---|---|
| Engine | SQLite (`better-sqlite3`) |
| Mode | Synchronous |
| WAL Mode | Enabled (`PRAGMA journal_mode = WAL`) |
| Foreign Keys | Enforced (`PRAGMA foreign_keys = ON`) |
| Database Path | `/Users/ashirabdalravee/Arong/db/arong.db` |
| Uploads Path (Arong) | `Arong/public/uploads/` |
| Uploads Path (Admin) | `Arong/public/uploads/` (Admin writes here so Arong serves them) |

---

## Database Schema

### `categories`

Stores product categories.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique category ID |
| `name` | TEXT | NOT NULL | Display name (e.g. "Skincare") |
| `slug` | TEXT | UNIQUE NOT NULL | URL-safe identifier (e.g. "skincare") |
| `description` | TEXT | | Short description |
| `image_url` | TEXT | | Optional category image |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Seeded categories (6):**
- Skincare (`skincare`)
- Makeup (`makeup`)
- Fragrances (`fragrances`)
- Hair Care (`hair-care`)
- Accessories (`accessories`)
- Body Care (`body-care`)

---

### `products`

Core product table. Each product belongs to one category.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique product ID |
| `name` | TEXT | NOT NULL | Product name |
| `slug` | TEXT | UNIQUE NOT NULL | URL-safe identifier |
| `description` | TEXT | | Full product description |
| `price_min` | REAL | NOT NULL DEFAULT 0 | Starting / minimum price in BDT (৳) |
| `price_max` | REAL | | Maximum price (for variant ranges) |
| `brand` | TEXT | | Brand name |
| `category_id` | INTEGER | FOREIGN KEY → categories(id) | Category reference |
| `is_new_arrival` | INTEGER | DEFAULT 0 | Boolean flag (0/1) |
| `is_featured` | INTEGER | DEFAULT 0 | Boolean flag (0/1) — shown on home page |
| `free_delivery` | INTEGER | DEFAULT 0 | Boolean flag (0/1) — shows "Free Delivery" badge |
| `discount_label` | TEXT | | Discount badge text (e.g. "10% OFF") |
| `stock` | INTEGER | DEFAULT 100 | Available inventory count |
| `notes` | TEXT | | Internal admin notes |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Seeded products: 50+ products** across all 6 categories.

---

### `product_images`

Stores one or more images per product. Cascades on product delete.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `product_id` | INTEGER | NOT NULL, FK → products(id) ON DELETE CASCADE | Owning product |
| `image_url` | TEXT | NOT NULL | Path like `/uploads/product-xxx.jpg` or `/placeholder.jpg` |
| `is_primary` | INTEGER | DEFAULT 0 | Boolean (1 = primary/display image) |

---

### `product_variants`

Optional size/shade/weight variants for a product. Cascades on product delete.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `product_id` | INTEGER | NOT NULL, FK → products(id) ON DELETE CASCADE | Owning product |
| `name` | TEXT | NOT NULL | Variant label (e.g. "30ml", "Red") |
| `price` | REAL | NOT NULL | Price for this specific variant |
| `stock` | INTEGER | DEFAULT 100 | Variant-level stock count |

---

### `orders`

Customer orders placed via the storefront checkout.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal order ID |
| `order_number` | TEXT | UNIQUE NOT NULL | Public order number — format: `ARG-XXXXXX-XXX` |
| `full_name` | TEXT | NOT NULL | Customer full name |
| `phone` | TEXT | NOT NULL | Customer phone number |
| `address` | TEXT | NOT NULL | Delivery address |
| `city` | TEXT | NOT NULL | City (from Bangladesh city list) |
| `division` | TEXT | NOT NULL | Bangladesh division (e.g. "Dhaka") |
| `subtotal` | REAL | NOT NULL | Cart subtotal before shipping/discount |
| `shipping_cost` | REAL | DEFAULT 0 | Shipping fee (৳60 Dhaka / ৳120 others) |
| `discount` | REAL | DEFAULT 0 | Coupon discount amount |
| `total` | REAL | NOT NULL | Final amount = subtotal + shipping - discount |
| `status` | TEXT | DEFAULT 'pending' | Order status (see below) |
| `payment_method` | TEXT | DEFAULT 'cash_on_delivery' | Currently only cash on delivery |
| `notes` | TEXT | | Optional customer notes |
| `coupon_code` | TEXT | | Applied coupon code (if any) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Order timestamp |

**Valid order statuses:**
`pending` → `confirmed` → `processing` → `shipped` → `delivered` | `cancelled`

---

### `order_items`

Line items for each order. Cascades on order delete.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `order_id` | INTEGER | NOT NULL, FK → orders(id) ON DELETE CASCADE | Parent order |
| `product_id` | INTEGER | | Product reference (nullable — product may be deleted) |
| `product_name` | TEXT | NOT NULL | Snapshot of product name at time of order |
| `variant_name` | TEXT | | Snapshot of variant name (if applicable) |
| `quantity` | INTEGER | NOT NULL DEFAULT 1 | Units ordered |
| `price` | REAL | NOT NULL | Unit price at time of order |

---

### `coupons`

Discount coupon codes.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `code` | TEXT | UNIQUE NOT NULL | Coupon code (stored/compared uppercase) |
| `discount_type` | TEXT | NOT NULL DEFAULT 'percentage' | `'percentage'` or `'fixed'` |
| `discount_value` | REAL | NOT NULL | Percentage amount or fixed BDT amount |
| `min_order` | REAL | DEFAULT 0 | Minimum subtotal to apply coupon |
| `max_uses` | INTEGER | | NULL = unlimited uses |
| `used_count` | INTEGER | DEFAULT 0 | Usage counter (incremented on each order) |
| `is_active` | INTEGER | DEFAULT 1 | Boolean enable/disable |
| `expires_at` | DATETIME | | NULL = never expires |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**Seeded coupons (3):**
- `WELCOME10` — 10% off, no minimum
- `ARONG20` — 20% off, minimum ৳500
- `FREESHIP` — Fixed ৳60 off (covers Dhaka shipping), minimum ৳300

---

## Entity Relationship Diagram

```
categories (1) ──────< products (N)
products (1) ─────────< product_images (N)
products (1) ─────────< product_variants (N)
orders (1) ───────────< order_items (N)
coupons (standalone, referenced by orders.coupon_code)
```

---

## API Routes — Arong Storefront

### `GET /api/products`

Fetches a paginated, filtered product list.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `category` | string | Filter by category slug (e.g. `skincare`) |
| `search` | string | Full-text search on name, brand, description |
| `sort` | string | `latest` (default), `oldest`, `price_asc`, `price_desc`, `name_asc` |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset (default: 0) |
| `featured` | `1` | Return only featured products |
| `new_arrival` | `1` | Return only new arrival products |

**Response:**
```json
{
  "products": [...],
  "total": 52,
  "limit": 20,
  "offset": 0
}
```

Each product includes a `primary_image` field (from `product_images`) and `category_name`, `category_slug` (from JOIN).

---

### `GET /api/products/[id]`

Fetches a single product by ID or slug, including all images and variants.

**Response:**
```json
{
  "product": { ...productFields },
  "images": [ { id, image_url, is_primary } ],
  "variants": [ { id, name, price, stock } ]
}
```

---

### `GET /api/categories`

Returns all categories.

**Response:**
```json
{ "categories": [...] }
```

---

### `POST /api/orders`

Places a new order. Wrapped in a SQLite transaction — inserts order, inserts all order items, increments coupon usage in one atomic operation.

**Request Body:**
```json
{
  "full_name": "Rahim Uddin",
  "phone": "01711111111",
  "address": "House 5, Road 3",
  "city": "Dhaka",
  "division": "Dhaka",
  "notes": "Leave at door",
  "coupon_code": "WELCOME10",
  "payment_method": "cash_on_delivery",
  "items": [
    {
      "product_id": 1,
      "product_name": "Vitamin C Serum",
      "variant_name": "30ml",
      "quantity": 2,
      "price": 690
    }
  ]
}
```

**Business Logic:**
- Calculates subtotal from items array
- Shipping: Dhaka division → ৳60, all other divisions → ৳120
- Validates coupon: must be active, within `max_uses`, not expired, subtotal meets `min_order`
- Calculates discount (percentage or fixed)
- Generates order number: `ARG-{last6ofTimestamp}-{random3digits}`
- Total = subtotal + shipping − discount

**Response (201):**
```json
{ "order_number": "ARG-123456-789", "order_id": 42, "total": 1410 }
```

---

### `GET /api/orders/[orderNumber]`

Fetches a full order by its public `order_number` string (e.g. `ARG-123456-789`), plus all its line items.

**Response:**
```json
{
  "order": { ...orderFields },
  "items": [ ...orderItems ]
}
```

---

### `GET /api/coupon`

Validates a coupon code and calculates the discount amount.

**Query Parameters:**

| Parameter | Description |
|---|---|
| `code` | Coupon code string |
| `subtotal` | Current cart subtotal as number |

**Response (valid):**
```json
{ "valid": true, "discount": 200, "coupon": { ...couponFields } }
```

**Response (invalid/expired/below minimum):**
```json
{ "error": "Invalid or expired coupon" }
```

---

## API Routes — Admin Panel

### `GET /api/products` (Admin)

Same filtering as storefront but with `search` by name/brand and `category` by ID. Default limit 50.

### `POST /api/products` (Admin)

Creates a product with images and variants in a single transaction. Auto-generates a unique slug by appending a timestamp. If no images are provided, inserts `/placeholder.jpg` as primary image.

### `GET /api/products/[id]` (Admin)

Returns product with all images and variants.

### `PUT /api/products/[id]` (Admin)

Full update — replaces all images and variants (delete + re-insert in a transaction). Updates all product fields.

### `DELETE /api/products/[id]` (Admin)

Deletes the product. `product_images` and `product_variants` cascade automatically.

---

### `GET /api/categories` (Admin)

Returns all categories.

### `POST /api/categories` (Admin)

Creates a new category with auto-generated slug from name.

### `PUT /api/categories/[id]` (Admin)

Updates category name, description, and image_url.

### `DELETE /api/categories/[id]` (Admin)

Deletes a category. Note: products referencing this category will have `category_id = NULL`.

---

### `GET /api/orders` (Admin)

Fetches paginated orders with optional status filter.

**Query Parameters:** `status`, `limit` (default 20), `offset` (default 0)

### `GET /api/orders/[id]` (Admin)

Returns a full order with all line items by internal numeric ID.

### `PATCH /api/orders/[id]` (Admin)

Updates order status. Validates against the allowed list:
`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

---

### `POST /api/upload` (Admin)

Handles product image uploads via multipart form data.

**Validations:**
- File must be present
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Maximum file size: **5 MB**

**Process:**
1. Generates a unique filename: `product-{timestamp}-{random}.{ext}`
2. Writes to `Arong/public/uploads/`
3. Returns the relative URL

**Response:**
```json
{ "url": "/uploads/product-1714000000000-abc123.jpg" }
```

---

### `GET /api/dashboard` (Admin)

Returns summary statistics for the admin dashboard.

**Response:**
```json
{
  "totalProducts": 52,
  "totalOrders": 18,
  "pendingOrders": 5,
  "revenue": 45890,
  "recentOrders": [ ...last10orders ]
}
```

Revenue excludes `cancelled` orders.

---

## Data Seeding

Seeding runs automatically in `Arong/lib/db.ts` on first database init. It is gated by a check:

```ts
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (catCount === 0) { /* seed */ }
```

The entire seed is wrapped in a single SQLite transaction. It inserts:
- 6 categories
- 50+ products (with variants and placeholder images)
- 3 coupons

---

## File Storage

Uploaded product images are written to:
```
/Users/ashirabdalravee/Arong/Arong/public/uploads/
```

The Admin app's `lib/db.ts` exports `uploadsDir` pointing to this same folder so that images uploaded via Admin are immediately served by the Arong Next.js static file server at `/uploads/filename.jpg`.

Placeholder image: `/placeholder.jpg` — served from `Arong/public/placeholder.jpg`.
