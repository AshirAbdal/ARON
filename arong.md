# Frontend Documentation — Arong Storefront

## Overview

The Arong storefront is a Next.js 14 e-commerce website for **Arong Cosmetics**, a Bangladesh-based cosmetics and accessories brand. It runs on **port 3000** and uses the App Router with a mix of Server and Client Components.

**URL:** http://localhost:3000  
**Directory:** `/Users/ashirabdalravee/Arong/Arong/`  
**Start command:** `npm run dev` (from the `Arong/` directory)

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.2.28 | App Router, SSR/SSG, API routes |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^3.3.0 | Utility-first styling |
| better-sqlite3 | ^11.9.1 | SQLite (used in API routes, server-side only) |
| lucide-react | ^0.363.0 | Icons |
| React Context + localStorage | — | Client-side cart state |

---

## Folder Structure

```
Arong/
├── app/
│   ├── layout.tsx              # Root layout (Navbar, Footer, CartSidebar, CartProvider)
│   ├── globals.css             # Tailwind base styles + custom CSS
│   ├── page.tsx                # Home page (Server Component)
│   ├── products/
│   │   ├── page.tsx            # Shop All page (Client Component)
│   │   └── [id]/
│   │       └── page.tsx        # Product Detail page (Client Component)
│   ├── new-arrivals/
│   │   └── page.tsx            # New Arrivals page (Server Component)
│   ├── track-order/
│   │   └── page.tsx            # Order Tracking page (Client Component)
│   ├── checkout/
│   │   └── page.tsx            # Checkout page (Client Component)
│   ├── order-success/
│   │   └── page.tsx            # Order Success page (Client Component)
│   └── api/
│       ├── products/
│       │   ├── route.ts        # GET product list
│       │   └── [id]/route.ts   # GET single product
│       ├── categories/
│       │   └── route.ts        # GET categories
│       ├── orders/
│       │   ├── route.ts        # POST place order
│       │   └── [orderNumber]/route.ts  # GET order by order number
│       └── coupon/
│           └── route.ts        # GET validate coupon
├── components/
│   ├── Navbar.tsx              # Top info bar + sticky nav
│   ├── Footer.tsx              # 4-column footer
│   ├── ProductCard.tsx         # Product grid card
│   ├── CartSidebar.tsx         # Slide-in cart panel
│   └── SearchModal.tsx         # Full-screen search overlay
├── context/
│   └── CartContext.tsx         # Global cart state (React Context + localStorage)
├── lib/
│   └── db.ts                   # Database connection + schema + seed
└── public/
    ├── placeholder.jpg         # Fallback product image (SVG content)
    └── uploads/                # Uploaded product images
```

---

## Root Layout — `app/layout.tsx`

Wraps all pages. Providers and persistent UI rendered here:

```
CartProvider (context)
└── <html>
    └── <body>
        ├── Navbar
        ├── {children}   ← page content
        ├── Footer
        └── CartSidebar
```

- Google Fonts (Inter) loaded via `next/font/google`
- `CartProvider` makes cart state available to all client components
- `CartSidebar` is always mounted — visibility controlled by `isOpen` state in context

---

## Context

### `CartContext.tsx`

Global cart state management using React Context. Persists cart to `localStorage` under the key `arong-cart`.

**`CartItem` interface:**

| Field | Type | Description |
|---|---|---|
| `product_id` | number | Product ID |
| `product_name` | string | Product name snapshot |
| `variant_id` | number? | Optional variant ID |
| `variant_name` | string? | Optional variant name |
| `price` | number | Unit price |
| `quantity` | number | Quantity in cart |
| `image` | string | Image URL for display |

**Exported values from `useCart()` hook:**

| Value | Type | Description |
|---|---|---|
| `items` | `CartItem[]` | All items in cart |
| `addItem(item)` | function | Add item — if same product+variant exists, increments quantity |
| `removeItem(id, variant?)` | function | Remove specific item |
| `updateQuantity(id, variant?, qty)` | function | Update qty; if qty ≤ 0, removes item |
| `clearCart()` | function | Empty entire cart |
| `totalItems` | number | Sum of all quantities |
| `subtotal` | number | Sum of price × quantity for all items |
| `isOpen` | boolean | Cart sidebar visibility state |
| `openCart()` | function | Show cart sidebar |
| `closeCart()` | function | Hide cart sidebar |

**localStorage sync:** Cart is loaded from `localStorage` on mount (`useEffect`) and saved back every time `items` changes.

---

## Components

### `Navbar.tsx`

**Type:** Client Component (`'use client'`)

Two-section header rendered on every page:

**Top Info Bar (black background):**
- WhatsApp link: `https://wa.me/8801700000000`
- Email: `arongbd@gmail.com`
- Phone: `+880 1700-000000`

**Main Navbar (sticky, white background):**
- **Logo:** "ARONG" / "Cosmetics" — links to `/`
- **Desktop Nav Links:**
  - Home (`/`)
  - **Shop All ▾** — dropdown (hover desktop / tap mobile) with a top "All Products" link plus a nested audience submenu. Hovering an audience reveals a flyout (opens to the right) listing every category from `/api/categories` (alphabetical):
    - All Products (`/products`)
    - Men ▸
      - All Men (`/products?audience=men`)
      - Accessories, Body Care, Fragrances, Hair Care, Makeup, Skincare → `/products?audience=men&category={slug}`
    - Women ▸
      - All Women (`/products?audience=women`)
      - Accessories, Body Care, Fragrances, Hair Care, Makeup, Skincare → `/products?audience=women&category={slug}`
    - Baby ▸
      - All Baby (`/products?audience=baby`)
      - Accessories, Body Care, Fragrances, Hair Care, Makeup, Skincare → `/products?audience=baby&category={slug}`
    - Unisex ▸
      - All Unisex (`/products?audience=unisex`)
      - Accessories, Body Care, Fragrances, Hair Care, Makeup, Skincare → `/products?audience=unisex&category={slug}`
  - **Products ▾** — dropdown listing all categories (fetched live from `GET /api/categories`, sorted A–Z). Each links to `/products?category={slug}`.
  - Track Order (`/track-order`)
  - FAQ (`/faq`)
- **Search icon:** Opens `SearchModal`
- **Cart icon:** Shows item count badge, calls `openCart()` from context
- **Mobile hamburger:** Toggles mobile menu. "Shop All" and "Products" appear as collapsible groups; under Shop All each audience (Men/Women/Baby/Unisex) is itself a collapsible row that reveals the same category list (chevron rotates on expand).
- **Scroll shadow:** Adds `shadow-md` when page is scrolled > 10px (uses `scroll` event listener)
- **Outside-click close:** Any open dropdown (and any open submenu) closes when the user clicks outside the navbar.

---

### `Footer.tsx`

Four-column footer rendered on every page:

| Column | Content |
|---|---|
| Social | Brand name + tagline + social media icons (Facebook, Instagram, YouTube) |
| Contact | WhatsApp, email, phone links |
| Customer Care | Track Order, Checkout links |
| Our Information | Shop All, New Arrivals, Skincare, Makeup links |

Bottom bar shows copyright: `© 2024 Arong Cosmetics. All rights reserved.`

---

### `ProductCard.tsx`

**Type:** Client Component (`'use client'`)

Reusable card used in all product grid listings.

**Props:**
```ts
{ product: Product }
```

**Visual structure:**
```
┌─────────────────────────────┐
│  [badges: category, discount]│
│       Product Image          │  ← hover: scale 105%
│  [Free Delivery badge]       │
├─────────────────────────────┤
│  Product Name                │
│  Brand                       │
│  Price (৳min - ৳max)        │
├─────────────────────────────┤
│  [Buy Now]  [Add to Cart]   │
└─────────────────────────────┘
```

**Badges (overlaid on image):**
- Category name — top-left, black
- Discount label — top-left below category, teal
- Free Delivery — top-right, teal

**Buttons:**
- **Buy Now (black fill):** Adds item to cart, then immediately navigates to `/checkout` via `window.location.href`
- **Add to Cart (border outline):** Adds item to cart, opens sidebar, shows brief "Adding…" text animation (800ms)

**Cart integration:**
- If product has variants, uses the first variant's name and price
- Falls back to `product.price_min` if no variants
- Image path: prepends `http://localhost:3000` if path is relative (starts with `/`)

**Card click:** Navigates to `/products/[id]` (entire card is wrapped in `<Link>`)

---

### `CartSidebar.tsx`

**Type:** Client Component  
Slides in from the right edge of the screen when `isOpen` is true.

**Layout:**
```
┌───────────────────────────┐
│  Your Cart   [×]          │
├───────────────────────────┤
│  [image] Product name     │
│          Variant name     │
│  [−] qty [+]  ৳price [🗑] │
│  ...                      │
├───────────────────────────┤
│  Subtotal:      ৳X,XXX    │
│  Shipping:      ৳60/120   │
├───────────────────────────┤
│  [Proceed To Checkout]    │
└───────────────────────────┘
```

**Functionality:**
- Backdrop (semi-transparent overlay) click closes the sidebar
- Quantity `−` / `+` buttons call `updateQuantity()` 
- Trash icon calls `removeItem()`
- Shipping estimate: shows ৳60 for Dhaka, ৳120 for others (note: displayed as an estimate before checkout)
- **Proceed To Checkout** button navigates to `/checkout` and closes the sidebar

---

### `SearchModal.tsx`

**Type:** Client Component  
Full-screen search overlay triggered by the search icon in Navbar.

**Behaviour:**
- Input is auto-focused when modal opens
- 300ms debounce on the search query before fetching
- Calls `GET /api/products?search={query}&limit=8`
- Results show product image, name, category, and price
- Clicking a result navigates to the product detail page and closes the modal
- `Escape` key or clicking the background closes the modal
- Shows "No products found" message for zero results

---

## Pages

### Home Page — `app/page.tsx`

**Type:** Server Component  
**URL:** http://localhost:3000

Data is fetched in parallel on the server via three `fetch()` calls to `http://localhost:3000/api/...` (absolute URL required for server components). All fetches use `cache: 'no-store'`.

**Sections:**

#### 1. Hero Section
Full-width gradient banner (`70vh` height, minimum 400px):
- Background: gradient from rose-50 → pink-50 → purple-50
- Black gradient overlay at bottom
- Heading: "ARONG Cosmetics"
- Subheading tagline
- **Shop All** (black) and **New Arrivals** (white) CTA buttons
- Decorative blurred circle shapes

#### 2. Shop by Category
Grid of 6 category tiles (3 cols mobile / 6 cols desktop). Each tile links to `/products?category={slug}`. Hover state: black background with white icon.

#### 3. New Arrivals
Displays the 4 most recent `is_new_arrival = 1` products in a 2×2 / 4×1 grid of `<ProductCard>` components. "View All New Arrivals" link to `/new-arrivals`.

#### 4. Featured Products
Displays the 4 most recent `is_featured = 1` products. "View All Featured" link to `/products?featured=1`.

#### 5. Banner Strip
Full-width dark banner with a promotional message and a Shop Now CTA.

---

### Shop All — `app/products/page.tsx`

**Type:** Client Component (`'use client'`)  
**URL:** http://localhost:3000/products

URL-driven state — all filters are reflected in the query string and read with `useSearchParams()`.

**Filter Controls:**

| Control | URL Param | Options |
|---|---|---|
| Audience tabs | `audience` | All, Men, Women, Baby (pill row above category tabs) |
| Search input | `search` | Free text, 400ms debounce |
| Category tabs | `category` | All + each category slug |
| Sort dropdown | `sort` | Latest, Price Low→High, Price High→Low, A–Z |
| Per page | `limit` | 12, 24, 48 |

**Page heading** updates based on the active audience:
- No filter → `All Products`
- `?audience=men` → `Men's Products`
- `?audience=women` → `Women's Products`
- `?audience=baby` → `Baby Products`

**Pagination:**  
Previous / Next buttons with page indicator. Offset calculated as `(page - 1) * limit`.

**Product grid:** 2 columns mobile / 4 columns desktop, using `<ProductCard>`.

**Loading state:** Shows a spinner while fetching.

**Empty state:** "No products found" message with a clear filters button.

---

### Product Detail — `app/products/[id]/page.tsx`

**Type:** Client Component  
**URL:** http://localhost:3000/products/[id]

Fetches `GET /api/products/[id]` on mount. Displays:

**Image Gallery (left side):**
- Large primary image display
- Thumbnail row — click to switch main image

**Product Info (right side):**
- Category breadcrumb
- Product name
- Brand
- Price display (range or single value)
- Badges: New Arrival, Free Delivery, Discount label
- Description text
- **Variant selector:** Clickable pill buttons — selecting a variant updates the displayed price
- Quantity selector with `−` / `+` buttons
- **Add to Cart** button — adds selected variant at selected quantity, opens sidebar
- **Buy Now** button — same as Add to Cart then navigates to `/checkout`
- Notes section (if any)

**Related Products:**  
Grid of up to 4 products from the same category (fetched separately), shown below the main product details.

---

### New Arrivals — `app/new-arrivals/page.tsx`

**Type:** Server Component  
**URL:** http://localhost:3000/new-arrivals

Fetches all `is_new_arrival = 1` products (limit 20) server-side. Displays them in a 2×2 / 4-column `<ProductCard>` grid.

---

### Track Order — `app/track-order/page.tsx`

**Type:** Client Component  
**URL:** http://localhost:3000/track-order

**Flow:**
1. Customer types their order number (format: `ARG-XXXXXX-XXX`) into the search box
2. On form submit, calls `GET /api/orders/{orderNumber}`
3. If found, displays full order details
4. If not found, shows "Order not found!!" error message

**Order status progress bar:**  
A 5-step horizontal timeline showing:
`Pending → Confirmed → Processing → Shipped → Delivered`

Steps up to and including the current status are filled black. Cancelled orders show the progress bar grayed out.

**Order detail display:**
- Order number, date, status badge
- Customer name, phone, delivery address
- Status progress bar
- Order items table: product name, variant, quantity, unit price, line total
- Pricing summary: subtotal, shipping, discount (if any), total

---

### Checkout — `app/checkout/page.tsx`

**Type:** Client Component  
**URL:** http://localhost:3000/checkout

Redirects to home if cart is empty.

**Left panel — Order Summary:**
- Editable cart item list with `−` / `+` quantity controls and trash delete
- Coupon code input + **Apply** button
  - Calls `GET /api/coupon?code={code}&subtotal={subtotal}`
  - Shows success/error message below input
  - Valid coupon deducts from total

**Right panel — Delivery Form:**

| Field | Input | Required |
|---|---|---|
| Full Name | text | Yes |
| Phone Number | text | Yes |
| Delivery Address | text | Yes |
| Division | select | Yes |
| City | select | Yes (populated based on selected division) |
| Order Notes | textarea | No |

**Bangladesh Divisions and Cities:**

| Division | Cities |
|---|---|
| Dhaka | Dhaka, Gazipur, Narayanganj, Manikganj, Munshiganj, Narsingdi, Tangail, Faridpur, Gopalganj |
| Chittagong | Chittagong, Cox's Bazar, Comilla, Feni, Noakhali, Lakshmipur, Chandpur, Brahmanbaria |
| Sylhet | Sylhet, Moulvibazar, Habiganj, Sunamganj |
| Rajshahi | Rajshahi, Bogra, Naogaon, Natore, Chapainawabganj, Pabna, Sirajganj, Joypurhat |
| Khulna | Khulna, Bagerhat, Satkhira, Jessore, Narail, Magura, Jhenaidah, Kushtia, Chuadanga, Meherpur |
| Barishal | Barishal, Bhola, Patuakhali, Pirojpur, Jhalokati, Barguna |
| Rangpur | Rangpur, Dinajpur, Nilphamari, Gaibandha, Kurigram, Lalmonirhat, Thakurgaon, Panchagarh |
| Mymensingh | Mymensingh, Jamalpur, Netrokona, Sherpur |

City dropdown is disabled until a division is selected. Selecting a new division resets the city field.

**Shipping calculation (live, before submit):**
- Dhaka division selected → ৳60
- Any other division selected → ৳120
- No division selected → ৳0 (not yet calculated)

**Order total formula:**
```
total = subtotal + shipping - discount
```

**Validation (client-side before submit):**
- Full name: required
- Phone: required
- Address: required
- Division: required
- City: required
- Shows inline error messages under each field

**Submit flow:**
1. Client-side validation runs
2. `POST /api/orders` called with full form + cart items
3. On success: `clearCart()`, redirect to `/order-success?order={orderNumber}`
4. On failure: shows `alert()` with error message

**Payment method:** Cash on Delivery only (hardcoded `payment_method: 'cash_on_delivery'`).

---

### Order Success — `app/order-success/page.tsx`

**Type:** Client Component  
**URL:** http://localhost:3000/order-success?order=ARG-XXXXXX-XXX

Reads `order` from URL search params. Displays:
- Success icon (checkmark)
- "Order Placed Successfully!" heading
- The order number prominently displayed
- Message to save the order number for tracking
- **Track Your Order** button → `/track-order`
- **Continue Shopping** button → `/products`

---

## API Routes (Storefront)

These routes run server-side inside Next.js. They directly query the SQLite database.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/products` | Product list with filters |
| GET | `/api/products/[id]` | Single product + images + variants |
| GET | `/api/categories` | All categories |
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders/[orderNumber]` | Fetch order by public order number |
| GET | `/api/coupon` | Validate coupon code |

See [backend.md](./backend.md) for full API documentation.

---

## Routing Map

| URL | Page | Type |
|---|---|---|
| `/` | Home | Server Component |
| `/products` | Shop All | Client Component |
| `/products/[id]` | Product Detail | Client Component |
| `/new-arrivals` | New Arrivals | Server Component |
| `/track-order` | Track Order | Client Component |
| `/checkout` | Checkout | Client Component |
| `/order-success` | Order Success | Client Component |

---

## Styling Conventions

- Tailwind CSS utility classes throughout
- Brand color palette: Black (`#000`), white, rose/pink gradient for hero
- Product badges: black (category), teal (`teal-500`) for discount and free delivery
- Button styles: Black fill = primary action, bordered = secondary action
- Responsive breakpoints: `md:` (768px) used for layout switches (2-col → 4-col grids, hamburger → desktop nav)
- Sticky navbar with scroll-triggered shadow
- Smooth hover transitions: `transition-colors`, `transition-shadow`, `transition-transform`

---

## Running the Storefront

```bash
cd /Users/ashirabdalravee/Arong/Arong
npm install        # first time only
npm run dev        # starts on http://localhost:3000
```

The database is auto-created and seeded at `/Users/ashirabdalravee/Arong/db/arong.db` on first start.
