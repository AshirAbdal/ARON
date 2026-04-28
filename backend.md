# Backend Documentation — Arong Cosmetics

## Overview

The backend is powered by **MySQL via `mysql2/promise`** (fully async). Both the `Arong` (storefront) and `Admin` apps connect to the **same MySQL database** using a connection pool. Each app has its own `lib/db.ts` that creates a pool using environment variables.

---

## Database Configuration

| Setting | Value |
|---|---|
| Engine | MySQL 8+ |
| Driver | `mysql2/promise` (pure JavaScript — no C++ compilation) |
| Mode | Async / connection pool |
| Connection limit | 10 per app |
| Config | Environment variables (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`) |
| Uploads Path | `Arong/public/uploads/` (Admin writes here; Arong serves them) |

### `lib/db.ts` (both apps)

```ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,  // returns DECIMAL as JS number, not string
});

export default pool;
```

### Environment variables required (both apps)

```
DB_HOST=localhost
DB_USER=<mysql_username>
DB_PASS=<mysql_password>
DB_NAME=<database_name>
```

---

## Database Schema

### `categories`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | AUTO_INCREMENT PRIMARY KEY |
| `name` | VARCHAR(255) | NOT NULL |
| `slug` | VARCHAR(255) | NOT NULL UNIQUE |
| `description` | TEXT | |
| `image_url` | VARCHAR(500) | |
| `created_at` | DATETIME | DEFAULT NOW() |

---

### `products`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | AUTO_INCREMENT PRIMARY KEY | |
| `name` | VARCHAR(255) | NOT NULL | |
| `slug` | VARCHAR(255) | NOT NULL UNIQUE | URL-safe identifier |
| `description` | TEXT | | |
| `price_min` | DECIMAL(10,2) | NOT NULL DEFAULT 0 | Starting / min price in BDT (৳) |
| `price_max` | DECIMAL(10,2) | | Max price for variant ranges |
| `brand` | VARCHAR(255) | | Brand name |
| `category_id` | INT | FK → categories(id) ON DELETE SET NULL | |
| `audience` | VARCHAR(20) | DEFAULT `'unisex'` | `men`, `women`, `baby`, `unisex` |
| `is_new_arrival` | TINYINT(1) | DEFAULT 0 | Boolean flag |
| `is_featured` | TINYINT(1) | DEFAULT 0 | Shown on home page |
| `free_delivery` | TINYINT(1) | DEFAULT 0 | Shows "Free Delivery" badge |
| `discount_label` | VARCHAR(100) | | e.g. "10% OFF" |
| `stock` | INT | DEFAULT 100 | Available inventory |
| `notes` | TEXT | | Internal admin notes |
| `created_at` | DATETIME | DEFAULT NOW() | |

---

### `product_images`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | AUTO_INCREMENT PRIMARY KEY |
| `product_id` | INT | NOT NULL, FK → products(id) ON DELETE CASCADE |
| `image_url` | VARCHAR(500) | NOT NULL |
| `is_primary` | TINYINT(1) | DEFAULT 0 — 1 = primary display image |

---

### `product_variants`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | AUTO_INCREMENT PRIMARY KEY |
| `product_id` | INT | NOT NULL, FK → products(id) ON DELETE CASCADE |
| `name` | VARCHAR(255) | NOT NULL — e.g. "30ml", "Red" |
| `price` | DECIMAL(10,2) | NOT NULL |
| `stock` | INT | DEFAULT 100 |

---

### `coupons`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | AUTO_INCREMENT PRIMARY KEY | |
| `code` | VARCHAR(100) | NOT NULL UNIQUE | Always stored UPPER CASE |
| `discount_type` | ENUM('percentage','fixed') | NOT NULL DEFAULT 'percentage' | |
| `discount_value` | DECIMAL(10,2) | NOT NULL | |
| `min_order` | DECIMAL(10,2) | DEFAULT 0 | Minimum eligible subtotal |
| `max_uses` | INT | | NULL = unlimited |
| `used_count` | INT | DEFAULT 0 | Atomically incremented on use |
| `is_active` | TINYINT(1) | DEFAULT 1 | |
| `expires_at` | DATETIME | | NULL = never expires |
| `scope` | ENUM('cart','category','product') | DEFAULT 'cart' | |
| `apply_to` | VARCHAR(20) | DEFAULT 'eligible' | `eligible` or `cart` |
| `created_at` | DATETIME | DEFAULT NOW() | |

---

### `coupon_targets`

Links a coupon to specific products or categories (used when `scope` is `product` or `category`).

| Column | Type | Constraints |
|---|---|---|
| `coupon_id` | INT | NOT NULL, FK → coupons(id) ON DELETE CASCADE |
| `target_type` | ENUM('category','product') | NOT NULL |
| `target_id` | INT | NOT NULL |
| — | PRIMARY KEY | `(coupon_id, target_type, target_id)` |

---

### `announcements`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | AUTO_INCREMENT PRIMARY KEY |
| `message` | VARCHAR(200) | NOT NULL |
| `is_active` | TINYINT(1) | DEFAULT 1 |
| `sort_order` | INT | DEFAULT 0 — lower = shown first |
| `starts_at` | DATETIME | NULL = always starts |
| `ends_at` | DATETIME | NULL = never ends |
| `created_at` | DATETIME | DEFAULT NOW() |

---

### `orders`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INT | AUTO_INCREMENT PRIMARY KEY | Internal ID |
| `order_number` | VARCHAR(50) | NOT NULL UNIQUE | Public ID — format `ARG-XXXXXX-XXX` |
| `full_name` | VARCHAR(255) | NOT NULL | |
| `phone` | VARCHAR(50) | NOT NULL | |
| `email` | VARCHAR(255) | | Optional |
| `address` | TEXT | NOT NULL | |
| `city` | VARCHAR(100) | NOT NULL | |
| `division` | VARCHAR(100) | NOT NULL | Bangladesh division |
| `subtotal` | DECIMAL(10,2) | DEFAULT 0 | Before shipping/discount |
| `shipping_cost` | DECIMAL(10,2) | DEFAULT 0 | ৳0 Sherpur / ৳120 others |
| `discount` | DECIMAL(10,2) | DEFAULT 0 | Coupon discount |
| `total` | DECIMAL(10,2) | NOT NULL | subtotal + shipping - discount |
| `payment_method` | VARCHAR(50) | DEFAULT 'cash_on_delivery' | |
| `payment_status` | VARCHAR(50) | DEFAULT 'pending' | |
| `status` | VARCHAR(50) | DEFAULT 'pending' | See statuses below |
| `notes` | TEXT | | Customer notes |
| `coupon_code` | VARCHAR(100) | | Applied coupon (if any) |
| `created_at` | DATETIME | DEFAULT NOW() | |

**Valid order statuses:** `pending` → `confirmed` → `processing` → `shipped` → `delivered` | `cancelled`

---

### `order_items`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | AUTO_INCREMENT PRIMARY KEY |
| `order_id` | INT | NOT NULL, FK → orders(id) ON DELETE CASCADE |
| `product_id` | INT | Nullable (product may be deleted) |
| `product_name` | VARCHAR(255) | NOT NULL — snapshot at time of order |
| `variant_name` | VARCHAR(255) | Snapshot of variant (if any) |
| `quantity` | INT | DEFAULT 1 |
| `price` | DECIMAL(10,2) | DEFAULT 0 — unit price at time of order |

---

## API Patterns

All database operations use `mysql2/promise` with parameterised queries.

```ts
// SELECT many rows
const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

// SELECT single row
const [rows] = await pool.execute<RowDataPacket[]>(sql, [id]);
const row = rows[0];  // undefined if not found

// INSERT
const [result] = await pool.execute<ResultSetHeader>(sql, params);
const newId = result.insertId;

// UPDATE / DELETE
const [result] = await pool.execute<ResultSetHeader>(sql, params);
// result.affectedRows — check if row existed

// Transaction
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  await conn.execute(sql1, params1);
  await conn.execute(sql2, params2);
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

---

## Coupon Logic (`Arong/lib/coupons.ts`)

| Function | Type | Description |
|---|---|---|
| `findUsableCoupon(code)` | `async → CouponRow \| null` | Returns coupon if active, not expired, has slots; does NOT lock |
| `eligibleProductIds(coupon, items)` | `async → Set<number>` | Resolves which cart product IDs are in scope |
| `evaluateCoupon(coupon, items, eligibleIds)` | `pure → CouponEvalResult` | Calculates discount; no DB calls |

In the orders route, the coupon is atomically reserved inside the transaction:
```sql
UPDATE coupons
   SET used_count = used_count + 1
 WHERE id = ?
   AND is_active = 1
   AND (expires_at IS NULL OR expires_at > NOW())
   AND (max_uses IS NULL OR used_count < max_uses)
```
`affectedRows === 1` confirms the slot was available and reserved.

