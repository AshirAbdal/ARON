# ARONG Cosmetics E-commerce Platform

A full-stack e-commerce platform built with Next.js and SQLite, consisting of two apps:

- **Arong/** — Main customer-facing website (port 3000)
- **Admin/** — Admin management panel (port 3001)

## Project Structure

```
Arong/           (root)
├── Arong/       ← Main website (Next.js, port 3000)
├── Admin/       ← Admin panel (Next.js, port 3001)
└── db/          ← Auto-created SQLite database
    └── arong.db ← Created on first run
```

## Quick Start

### 1. Install dependencies

```bash
# Install main website dependencies
cd Arong
npm install

# Install admin dependencies
cd ../Admin
npm install
```

### 2. Run both apps

Open two terminal windows:

**Terminal 1 — Main Website:**
```bash
cd Arong
npm run dev
# Open http://localhost:3000
```

**Terminal 2 — Admin Panel:**
```bash
cd Admin
npm run dev
# Open http://localhost:3001
```

The database (`db/arong.db`) and initial seed data (50+ products, 6 categories) are created automatically on first run.

## Features

### Main Website (localhost:3000)
- **Home** — Hero, featured products, new arrivals, categories
- **Shop All** (`/products`) — Search, filter by category, sort, pagination
- **Product Detail** (`/products/[id]`) — Images, variants, add to cart, buy now
- **New Arrivals** (`/new-arrivals`) — All new arrival products
- **Track Order** (`/track-order`) — Search by order ID
- **Checkout** (`/checkout`) — Full Bangladesh shipping form, coupon codes, Cash on Delivery
- **Cart Sidebar** — Slide-in cart with quantity controls

### Admin Panel (localhost:3001)
- **Dashboard** — Stats (products, orders, revenue, pending)
- **Products** — List, search, add, edit, delete
- **Add/Edit Product** — Name, description, images (upload), variants, price, stock, flags
- **Orders** — List with status filter, update order status
- **Order Detail** — Full order info, items, customer details
- **Categories** — Add, edit, delete categories

## Coupons (pre-seeded)
| Code | Discount |
|------|----------|
| ARONG10 | 10% off (min ৳500) |
| WELCOME50 | ৳50 flat (min ৳300) |
| BEAUTY15 | 15% off (min ৳1000) |

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite via better-sqlite3
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Icons:** lucide-react
- **Currency:** Bangladeshi Taka (৳)
