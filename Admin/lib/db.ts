import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), '..', 'db', 'arong.db');
const dbDir = path.dirname(dbPath);
// Admin uploads point to the Arong app's public/uploads folder
const uploadsDir = path.resolve(process.cwd(), '..', 'Arong', 'public', 'uploads');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema must mirror Arong/lib/db.ts
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_min REAL NOT NULL DEFAULT 0,
    price_max REAL,
    brand TEXT,
    category_id INTEGER,
    audience TEXT DEFAULT 'unisex',
    is_new_arrival INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    free_delivery INTEGER DEFAULT 0,
    discount_label TEXT,
    stock INTEGER DEFAULT 100,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 100,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    division TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping_cost REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'cash_on_delivery',
    notes TEXT,
    coupon_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value REAL NOT NULL,
    min_order REAL DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: ensure `audience` column exists on products (idempotent)
try {
  db.exec(`ALTER TABLE products ADD COLUMN audience TEXT DEFAULT 'unisex'`);
} catch {
  // column already exists — safe to ignore
}

// Migration: ensure `email` column exists on orders (idempotent)
try {
  db.exec(`ALTER TABLE orders ADD COLUMN email TEXT`);
} catch {
  // column already exists — safe to ignore
}

// Migration: coupon scoping (idempotent)
try {
  db.exec(`ALTER TABLE coupons ADD COLUMN scope TEXT NOT NULL DEFAULT 'cart'`);
} catch {
  // column already exists — safe to ignore
}
try {
  db.exec(`ALTER TABLE coupons ADD COLUMN apply_to TEXT NOT NULL DEFAULT 'eligible'`);
} catch {
  // column already exists — safe to ignore
}
db.exec(`
  CREATE TABLE IF NOT EXISTS coupon_targets (
    coupon_id   INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id   INTEGER NOT NULL,
    PRIMARY KEY (coupon_id, target_type, target_id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_coupon_targets_coupon ON coupon_targets(coupon_id);
`);

// Announcements (top-bar marquee messages managed from admin)
db.exec(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    starts_at DATETIME,
    ends_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
`);

export default db;
export { uploadsDir };
