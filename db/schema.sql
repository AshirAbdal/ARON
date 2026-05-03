-- ============================================================
--  ARON — MySQL Schema
--  Run once in cPanel → phpMyAdmin (Import tab) or via CLI:
--    mysql -u DB_USER -p DB_NAME < schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────────────
-- categories
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  slug        VARCHAR(255)  NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  created_at  DATETIME      NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- products
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255)  NOT NULL,
  slug           VARCHAR(255)  NOT NULL UNIQUE,
  description    TEXT,
  price_min      DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_max      DECIMAL(10,2),
  brand          VARCHAR(255),
  category_id    INT,
  audience       VARCHAR(20)   NOT NULL DEFAULT 'unisex',  -- men | women | baby | unisex
  is_new_arrival TINYINT(1)   NOT NULL DEFAULT 0,
  is_featured    TINYINT(1)   NOT NULL DEFAULT 0,
  free_delivery  TINYINT(1)   NOT NULL DEFAULT 0,
  discount_label VARCHAR(100),
  stock          INT           NOT NULL DEFAULT 100,
  notes          TEXT,
  created_at     DATETIME      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ────────────────────────────────────────────────
-- product_images
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT          NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  is_primary TINYINT(1)  NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────
-- product_variants
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT           NOT NULL,
  name       VARCHAR(255)  NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  stock      INT           NOT NULL DEFAULT 100,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────
-- coupons
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  code           VARCHAR(100)  NOT NULL UNIQUE,
  discount_type  ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order      DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses       INT,
  used_count     INT           NOT NULL DEFAULT 0,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  expires_at     DATETIME,
  scope          ENUM('cart','category','product') NOT NULL DEFAULT 'cart',
  apply_to       VARCHAR(20)   NOT NULL DEFAULT 'eligible',  -- eligible | cart
  created_at     DATETIME      NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- coupon_targets  (category / product scope links)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_targets (
  coupon_id   INT NOT NULL,
  target_type ENUM('category','product') NOT NULL,
  target_id   INT NOT NULL,
  PRIMARY KEY (coupon_id, target_type, target_id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────
-- announcements
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  message    VARCHAR(200)  NOT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT           NOT NULL DEFAULT 0,
  starts_at  DATETIME,
  ends_at    DATETIME,
  created_at DATETIME      NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- orders
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_number   VARCHAR(50)   NOT NULL UNIQUE,
  full_name      VARCHAR(255)  NOT NULL,
  phone          VARCHAR(50)   NOT NULL,
  email          VARCHAR(255),
  address        TEXT          NOT NULL,
  city           VARCHAR(100)  NOT NULL,
  division       VARCHAR(100)  NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost  DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  total          DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50)   NOT NULL DEFAULT 'cash_on_delivery',
  payment_status VARCHAR(50)   NOT NULL DEFAULT 'pending',
  status         VARCHAR(50)   NOT NULL DEFAULT 'pending',
  notes          TEXT,
  coupon_code    VARCHAR(100),
  created_at     DATETIME      NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- order_items
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT           NOT NULL,
  product_id   INT,
  product_name VARCHAR(255)  NOT NULL,
  variant_name VARCHAR(255),
  quantity     INT           NOT NULL DEFAULT 1,
  price        DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────
-- suspicious_orders (fraud review queue)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suspicious_orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT,
  order_number  VARCHAR(50),
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(50)  NOT NULL,
  email         VARCHAR(255),
  ip            VARCHAR(100),
  score         INT          NOT NULL DEFAULT 0,
  reasons_json  TEXT         NOT NULL,
  review_status VARCHAR(20)  NOT NULL DEFAULT 'pending',
  reviewed_by   VARCHAR(100),
  reviewed_at   DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;

-- ────────────────────────────────────────────────
-- Useful indexes for performance
-- ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured   ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created      ON orders(created_at);
