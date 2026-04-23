# Admin Panel Documentation — Arong Cosmetics

## Overview

The Admin panel is a separate Next.js 14 application running on **port 3001**. It provides full control over products, categories, orders, and business analytics. It shares the same SQLite database as the storefront.

**URL:** http://localhost:3001  
**Directory:** `/Users/ashirabdalravee/Arong/Admin/`  
**Start command:** `npm run dev` (from the `Admin/` directory)

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.2.28 | App Router framework |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^3.3.0 | Styling |
| better-sqlite3 | ^11.9.1 | SQLite database access |
| lucide-react | ^0.363.0 | Icons |

---

## Folder Structure

```
Admin/
├── app/
│   ├── layout.tsx              # Root layout with Sidebar
│   ├── globals.css             # Tailwind base styles
│   ├── page.tsx                # Dashboard page
│   ├── products/
│   │   ├── page.tsx            # Product list
│   │   ├── new/
│   │   │   └── page.tsx        # Add product
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx    # Edit product
│   ├── orders/
│   │   ├── page.tsx            # Order list
│   │   └── [id]/
│   │       └── page.tsx        # Order detail
│   ├── categories/
│   │   └── page.tsx            # Category management
│   └── api/
│       ├── products/
│       │   ├── route.ts        # GET list, POST create
│       │   └── [id]/route.ts   # GET, PUT, DELETE by ID
│       ├── categories/
│       │   ├── route.ts        # GET, POST
│       │   └── [id]/route.ts   # PUT, DELETE
│       ├── orders/
│       │   ├── route.ts        # GET list
│       │   └── [id]/route.ts   # GET detail, PATCH status
│       ├── upload/
│       │   └── route.ts        # POST image upload
│       └── dashboard/
│           └── route.ts        # GET statistics
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── ProductForm.tsx         # Shared add/edit form
└── lib/
    └── db.ts                   # Database connection
```

---

## Layout

### `app/layout.tsx`

Root layout that wraps every admin page. Renders the `Sidebar` on the left (fixed, 256px wide) and the page content in the main area with `ml-64` offset.

```
┌──────────────┬────────────────────────────────┐
│   Sidebar    │       Page Content             │
│   (w-64)     │       (ml-64, p-8)             │
│   fixed      │                                │
└──────────────┴────────────────────────────────┘
```

---

## Components

### `Sidebar.tsx`

Fixed left sidebar with black background. Contains:

- **Brand header:** "ARONG Admin" logo
- **Navigation links:**
  - Dashboard (`/`)
  - Products (`/products`)
  - Orders (`/orders`)
  - Categories (`/categories`)
- **View Store link:** Opens `http://localhost:3000` in a new tab
- Active state: current path highlighted with white background + black text

All nav items use `lucide-react` icons: `LayoutDashboard`, `Package`, `ShoppingBag`, `Tag`, `ExternalLink`.

---

### `ProductForm.tsx`

Shared reusable form component used by both the **Add Product** and **Edit Product** pages.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `initialData` | `Partial<ProductFormData>` | Pre-filled values for edit mode |
| `categories` | `Category[]` | List of categories for the dropdown |
| `onSubmit` | `(data) => Promise<void>` | Submission handler (differs between add/edit) |
| `submitLabel` | `string` | Button label (default: "Save Product") |

**Form Fields:**

| Field | Input Type | Description |
|---|---|---|
| Product Name | text | Required |
| Description | textarea | Full product description |
| Min Price (৳) | number | Required — starting price |
| Max Price (৳) | number | Optional — for variant price ranges |
| Brand | text | Brand name |
| Category | select | Dropdown of all categories |
| Stock | number | Inventory count (default: 100) |
| Discount Label | text | Badge text e.g. "10% OFF" |
| Notes | textarea | Internal admin notes |
| New Arrival | checkbox | Marks as new arrival |
| Featured | checkbox | Shows on homepage featured section |
| Free Delivery | checkbox | Shows "Free Delivery" badge |
| Images | file input | Multi-file upload |
| Variants | dynamic list | Add/remove size/shade/price variants |

**Image Upload Flow:**
1. Admin selects one or more files via the file input
2. Each file is immediately uploaded to `POST /api/upload`
3. On success, the returned URL is added to the `images` array in state
4. Images display as thumbnails with a remove (×) button
5. First image in the array is automatically the primary image

**Variant Management:**
- Click **"Add Variant"** to append a new row `{ name, price, stock }`
- Each row has Name, Price, Stock fields and a delete button
- Variants are stored and submitted as an array

**Validation (client-side):**
- Product name: required
- Min price: required, must be a positive number

---

## Pages

### Dashboard — `app/page.tsx`

**URL:** http://localhost:3001

Fetches stats from `GET /api/dashboard` on mount and displays:

**Stats Cards (4):**

| Card | Value | Icon | Color |
|---|---|---|---|
| Total Products | count | Package | blue |
| Total Orders | count | ShoppingBag | green |
| Pending Orders | count | Clock | yellow |
| Total Revenue | ৳ amount | DollarSign | purple |

Revenue excludes cancelled orders.

**Recent Orders Table:**
Shows the 10 most recent orders with columns: Order #, Customer, Total, Status badge, Date. Each row links to the order detail page.

---

### Product List — `app/products/page.tsx`

**URL:** http://localhost:3001/products

**Features:**
- Displays all products in a data table
- **Search bar:** Filters by product name or brand (client-side fetch on input change)
- **Category filter:** Dropdown to filter by category
- Each row shows: thumbnail image, name, brand, category, price range, stock, status badges (New/Featured), Edit and Delete action buttons
- **Add Product** button links to `/products/new`
- **Delete:** Calls `DELETE /api/products/[id]`, confirms with `window.confirm()` before proceeding, refreshes the list on success

---

### Add Product — `app/products/new/page.tsx`

**URL:** http://localhost:3001/products/new

Loads all categories via `GET /api/categories`, then renders `<ProductForm>`.

**Submit handler:** Calls `POST /api/products` with the full form data. On success, redirects to `/products`.

---

### Edit Product — `app/products/[id]/edit/page.tsx`

**URL:** http://localhost:3001/products/[id]/edit

On mount, fetches `GET /api/products/[id]` to load the existing product, images, and variants. Transforms the data to match `ProductFormData` shape (maps `image_url` fields to `{ url }` objects), then passes it as `initialData` to `<ProductForm>`.

**Submit handler:** Calls `PUT /api/products/[id]` with full updated data. On success, redirects to `/products`.

---

### Orders List — `app/orders/page.tsx`

**URL:** http://localhost:3001/orders

**Features:**
- Fetches all orders (limit 100) from `GET /api/orders`
- **Status filter pills:** All / Pending / Confirmed / Processing / Shipped / Delivered / Cancelled
  - Active filter shown with filled black pill
  - Clicking a filter re-fetches with that status
- Order count displayed under page heading
- Each row shows: Order #, Customer name & phone, Location (city/division), Total, Status badge, Date, inline status dropdown
- **Inline status update:** A `<select>` per row immediately calls `PATCH /api/orders/[id]` on change, then re-fetches the list

**Status badge colors:**

| Status | Color |
|---|---|
| pending | yellow |
| confirmed | blue |
| processing | indigo |
| shipped | purple |
| delivered | green |
| cancelled | red |

---

### Order Detail — `app/orders/[id]/page.tsx`

**URL:** http://localhost:3001/orders/[id]

Fetches `GET /api/orders/[id]` on mount. Displays:

**Customer Information panel:**
- Full name, phone, delivery address (address + city + division)
- Payment method, notes (if any)

**Order Items table:**
- Product name, variant name, quantity, unit price, line total

**Order Summary panel:**
- Subtotal
- Shipping cost
- Discount (shown only if > 0, with coupon code)
- **Total** (bold)

**Status Update buttons:**
Row of clickable status buttons — clicking any calls `PATCH /api/orders/[id]` and refreshes the page. Current status is highlighted.

---

### Categories — `app/categories/page.tsx`

**URL:** http://localhost:3001/categories

Fully inline CRUD management — no separate pages needed.

**Features:**

| Action | Behaviour |
|---|---|
| **List** | Fetches `GET /api/categories`, shows name, slug, description, product count |
| **Add** | Inline form at top of page — name, description fields. Calls `POST /api/categories`. |
| **Edit** | Click edit icon on a row — row becomes an inline editable form. Calls `PUT /api/categories/[id]`. |
| **Delete** | Click delete icon — confirms with `window.confirm()`, calls `DELETE /api/categories/[id]`, refreshes list. |

---

## API Reference (Admin)

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List with search/category/pagination filters |
| POST | `/api/products` | Create product (with images + variants in a transaction) |
| GET | `/api/products/[id]` | Single product with images and variants |
| PUT | `/api/products/[id]` | Full update — replaces images and variants |
| DELETE | `/api/products/[id]` | Delete product (cascades to images + variants) |

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | All categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/[id]` | Update category |
| DELETE | `/api/categories/[id]` | Delete category |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | Paginated order list with optional status filter |
| GET | `/api/orders/[id]` | Single order with line items (by numeric ID) |
| PATCH | `/api/orders/[id]` | Update order status |

### Upload

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload product image (multipart/form-data, field name: `file`) |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Summary stats + 10 recent orders |

---

## Image Upload Specification

- **Field name:** `file`
- **Allowed types:** JPEG, PNG, WebP, GIF
- **Max size:** 5 MB
- **Output URL format:** `/uploads/product-{timestamp}-{random}.{ext}`
- **Storage location:** `Arong/public/uploads/` (served directly by Next.js at `localhost:3000/uploads/...`)

---

## Order Status Workflow

```
pending → confirmed → processing → shipped → delivered
                                         ↘ cancelled (from any stage)
```

Admin can move an order to any status at any time. No enforced progression order in the backend.

---

## Running the Admin Panel

```bash
cd /Users/ashirabdalravee/Arong/Admin
npm install        # first time only
npm run dev        # starts on http://localhost:3001
```

The storefront must also be running on port 3000 for the "View Store" link and for images to load.
