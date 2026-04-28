# ARONG Cosmetics E-commerce Platform

A full-stack e-commerce platform built with Next.js and MySQL, consisting of two apps:

- **Arong/** — Main customer-facing website (port 3000)
- **Admin/** — Admin management panel (port 3001)

## Project Structure

```
Arong/           (root)
├── Arong/       ← Main website (Next.js, port 3000)
├── Admin/       ← Admin panel (Next.js, port 3001)
└── db/
    └── schema.sql ← MySQL schema (run once to create tables)
```

## Quick Start

### Prerequisites

- Node.js 20+
- A running MySQL server (local or remote)
- Create a database and note the credentials

### 1. Configure environment variables

Create `.env.local` in both `Arong/` and `Admin/` directories:

```env
# Database (both apps use the same DB)
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_NAME=arong
```

Admin app also needs:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
SESSION_SECRET=some_long_random_string
```

### 2. Create the database tables

```bash
mysql -u your_user -p arong < db/schema.sql
```

### 3. Install dependencies

```bash
cd Arong && npm install
cd ../Admin && npm install
```

### 4. Run both apps

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

## Features

### Main Website (localhost:3000)
- **Home** — Hero, featured products, new arrivals, categories
- **Shop All** (`/products`) — Search, filter by category/audience, sort, pagination
- **Product Detail** (`/products/[id]`) — Images, variants, add to cart, buy now
- **New Arrivals** (`/new-arrivals`) — All new arrival products
- **Track Order** (`/track-order`) — Search by order number
- **Checkout** (`/checkout`) — Full Bangladesh shipping form, coupon codes, Cash on Delivery
- **Cart Sidebar** — Slide-in cart with quantity controls

### Admin Panel (localhost:3001)
- **Dashboard** — Stats (products, orders, revenue, pending)
- **Products** — List, search, add, edit, delete
- **Add/Edit Product** — Name, description, images (upload), variants, price, stock, flags
- **Orders** — List with status filter, update order status
- **Order Detail** — Full order info, items, customer details
- **Categories** — Add, edit, delete categories
- **Coupons** — Create and manage discount codes (cart/category/product scope)
- **Announcements** — Manage top-bar promotional messages

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** MySQL via mysql2
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Icons:** lucide-react
- **Email:** nodemailer
- **Currency:** Bangladeshi Taka (৳)
