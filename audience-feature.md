# Feature Plan — Audience Sub-Categories under Shop All (Men / Women / Baby)

> **Status:** Proposal — not implemented. Awaiting approval before any code changes.
> **Constraint:** No design changes. Reuse existing UI patterns (dropdown, tabs, pills, badges).

---

## 1. Goal

Add **Men**, **Women**, and **Baby** as **sub-categories of "Shop All"** in the navbar. Hovering / tapping "Shop All" reveals a dropdown menu with these three options. Each option filters the storefront by audience while preserving the existing 6 product categories (Skincare, Makeup, Fragrances, Hair Care, Accessories, Body Care).

```
Shop All ▾
   ├── Men      → /products?audience=men
   ├── Women    → /products?audience=women
   └── Baby     → /products?audience=baby
```

Audience and Category remain **two independent filter dimensions** that can be combined:
- `Men` + `Skincare`
- `Women` + `Makeup`
- `Baby` + `Body Care`

---

## 2. Recommended Approach — Add `audience` column to `products`

**Schema change (single column):**

| Table | New Column | Type | Allowed Values | Default |
|---|---|---|---|---|
| `products` | `audience` | TEXT | `men`, `women`, `baby`, `unisex` | `unisex` |

**Why this approach (not parent/child categories or many-to-many):**
- Smallest schema change — 1 column, no new tables, no restructuring of `categories`.
- Doesn't disturb the existing 6 categories or 50+ seeded products.
- Filtering by audience + category is a clean URL combo: `/products?audience=men&category=skincare`.
- Naturally backwards compatible — old products default to `unisex` and remain visible.
- The "sub-category" hierarchy is purely a **navigation pattern** (a dropdown), not a database hierarchy.

---

## 3. Where the Options Will Show in the Design

### 3.1 Storefront — `Arong/components/Navbar.tsx` (PRIMARY CHANGE)

**Current desktop nav links:**
```
Home | Shop All | Skincare | Makeup | Track Order | FAQ
```

**Proposed nav structure (two dropdowns: Shop All by audience, Products by category):**
```
Home | Shop All ▾ | Products ▾ | Track Order | FAQ
              │             │
              │             ├── Accessories  → /products?category=accessories
              │             ├── Body Care    → /products?category=body-care
              │             ├── Fragrances   → /products?category=fragrances
              │             ├── Hair Care    → /products?category=hair-care
              │             ├── Makeup       → /products?category=makeup
              │             └── Skincare     → /products?category=skincare
              │
              ├── All Products  → /products
              ├── Men           → /products?audience=men
              ├── Women         → /products?audience=women
              └── Baby          → /products?audience=baby
```

**Behavior:**
- Clicking "Shop All" itself still navigates to `/products` (shows everything).
- Clicking "Products" itself also navigates to `/products`.
- Hovering (desktop) opens the matching dropdown panel directly underneath.
- Dropdown closes when the mouse leaves OR the user clicks an item OR clicks outside.
- Mobile: tapping either parent in the hamburger menu expands an inline collapsible list of its sub-items underneath it.
- The two existing standalone shortcuts (`Skincare`, `Makeup`) are **removed** — they now live inside the `Products` dropdown along with the other 4 categories.
- Categories inside the `Products` dropdown are **dynamic** — fetched from `GET /api/categories`, so adding/removing categories in admin updates the menu automatically.

**Dropdown design (reuses existing styles — no new CSS system):**

Shop All dropdown:
```
┌─────────────────────┐
│  All Products       │ ← hover: bg-gray-100
│  Men                │
│  Women              │
│  Baby               │
└─────────────────────┘
```

Products dropdown:
```
┌─────────────────────┐
│  Accessories        │
│  Body Care          │
│  Fragrances         │
│  Hair Care          │
│  Makeup             │
│  Skincare           │
└─────────────────────┘
```
- White background, soft shadow (`shadow-lg`), rounded corners — matches the visual language of `SearchModal` and `CartSidebar`.
- Each item: `px-4 py-2`, `text-sm`, `hover:bg-gray-100`.
- No new colors, no new icons.
- Caret indicator (`ChevronDown` from `lucide-react` — already a dependency) shown next to both "Shop All" and "Products".

**Mobile menu (hamburger):**
```
Home
Shop All                  ▾  ← tap to expand
   ├ All Products
   ├ Men
   ├ Women
   └ Baby
Products                  ▾  ← tap to expand
   ├ Accessories
   ├ Body Care
   ├ Fragrances
   ├ Hair Care
   ├ Makeup
   └ Skincare
Track Order
FAQ
```
- Sub-items shown indented when expanded, using existing mobile menu typography.

---

### 3.2 Storefront — Shop All page (`Arong/app/products/page.tsx`)

**Current filter row:**
```
[Search input]
[All] [Skincare] [Makeup] [Fragrances] [Hair Care] [Accessories] [Body Care]   ← Category tabs
[Sort dropdown] [Per page dropdown]
```

**Proposed filter row (add a second tab strip ABOVE the category tabs):**
```
[Search input]
[All] [Men] [Women] [Baby]                                                     ← NEW Audience tabs
[All] [Skincare] [Makeup] [Fragrances] [Hair Care] [Accessories] [Body Care]   ← Existing category tabs (unchanged)
[Sort dropdown] [Per page dropdown]
```

- New audience tabs use the **same pill style** as the existing category tabs.
- Active tab → black fill, white text. Inactive → white background, black border.
- Reads `audience` from `useSearchParams()`, writes back to URL on click.
- When the user lands here from the navbar dropdown (e.g. `/products?audience=men`), the matching audience pill is automatically active.
- Combines naturally with `category` filter — e.g. `?audience=women&category=makeup&sort=price_asc`.

**Page heading reflects the active audience:**
- No filter → `All Products`
- `?audience=men` → `Men's Products`
- `?audience=women` → `Women's Products`
- `?audience=baby` → `Baby Products`

---

### 3.3 Storefront — Home page (`Arong/app/page.tsx`)

**No changes.** The "Shop by Category" section stays exactly as-is. Audience entry is exclusively through the navbar dropdown, keeping the hierarchy clear (Shop All → Men/Women/Baby).

---

### 3.4 Storefront — Product Card (`Arong/components/ProductCard.tsx`)

**No changes.** Audience is conveyed by the navigation context, not the card.

---

### 3.5 Storefront — Product Detail page (`Arong/app/products/[id]/page.tsx`)

**Optional small line under brand** (recommended SKIP — keeps detail page clean):
```
Brand: La Roche-Posay
For: Women        ← optional, skipped if unisex
```

---

### 3.6 Admin — Product Form (`Admin/components/ProductForm.tsx`)

**Add one new dropdown field** next to the existing Category dropdown:

```
┌─────────────────────────┬─────────────────────────┐
│  Category   [Skincare▾] │  Audience   [Unisex▾]   │  ← NEW
└─────────────────────────┴─────────────────────────┘
```

- `<select>` with 4 options: **Unisex, Men, Women, Baby**.
- Default: `Unisex`.
- Same styling as the Category dropdown — no design change.

---

### 3.7 Admin — Product List (`Admin/app/products/page.tsx`)

**Add an "Audience" column** to the table (between Category and Stock):

| Image | Name | Brand | Category | **Audience** | Stock | Status | Actions |
|---|---|---|---|---|---|---|---|

- Show the value as plain text (e.g. `Men`, `Women`, `Baby`, `Unisex`).
- Optional: an Audience filter dropdown next to the existing Category filter.

---

### 3.8 Admin — no other pages need changes

Dashboard, Orders, Categories pages are unaffected.

---

## 4. API Changes

### 4.1 `GET /api/products` (both Arong + Admin)

Add a new optional query parameter:

| Parameter | Type | Description |
|---|---|---|
| `audience` | string | `men`, `women`, `baby`, or `unisex` |

When present, adds `AND audience = ?` to the SQL WHERE clause.

### 4.2 `POST /api/products` & `PUT /api/products/[id]` (Admin)

Accept and persist the new `audience` field. Default to `unisex` if missing.

### 4.3 `GET /api/products/[id]`

Returns the new `audience` field as part of the product object. No structural change.

### 4.4 No changes to:

- `/api/categories` — categories are unchanged.
- `/api/orders` — audience is a product attribute, not stored on orders.
- `/api/coupon` — unaffected.
- `/api/dashboard` — unaffected.
- `/api/upload` — unaffected.

---

## 5. Database Migration

**File:** `Arong/lib/db.ts` (and mirror in `Admin/lib/db.ts`)

**Migration logic** (runs automatically on app start, idempotent):

```sql
-- Pseudocode — actual code added on approval
ALTER TABLE products ADD COLUMN audience TEXT DEFAULT 'unisex';
```

Wrapped in a try/catch — if the column already exists, the error is swallowed.

**Backfill for existing 50+ seeded products:**
- All existing products get `audience = 'unisex'` by default (column default).
- You can re-tag them in the Admin panel afterward.
- Alternative: pre-tag obvious products during migration (lipstick → women, baby lotion → baby).

---

## 6. URL Scheme

| URL | Result |
|---|---|
| `/products` | All products |
| `/products?audience=men` | Men's products only |
| `/products?audience=women` | Women's products only |
| `/products?audience=baby` | Baby products only |
| `/products?audience=women&category=skincare` | Women's skincare |
| `/products?audience=baby&sort=price_asc` | Baby products, cheapest first |

The navbar dropdown sets the `audience` param. Audience tabs and category tabs both manipulate the same URL — both filters compose.

---

## 7. Navigation Hierarchy Summary

```
Navbar
├── Home
├── Shop All ▾                    (clickable + hover dropdown)
│      ├── All Products           → /products
│      ├── Men                    → /products?audience=men
│      ├── Women                  → /products?audience=women
│      └── Baby                   → /products?audience=baby
├── Products ▾                    (clickable + hover dropdown)
│      ├── Accessories            → /products?category=accessories
│      ├── Body Care              → /products?category=body-care
│      ├── Fragrances             → /products?category=fragrances
│      ├── Hair Care              → /products?category=hair-care
│      ├── Makeup                 → /products?category=makeup
│      └── Skincare               → /products?category=skincare
├── Track Order
└── FAQ

Inside /products page:
   Audience tabs:   [All] [Men] [Women] [Baby]
   Category tabs:   [All] [Skincare] [Makeup] [Fragrances] [Hair Care] [Accessories] [Body Care]
```

---

## 8. Files That Will Change

### Storefront (`Arong/`)
| File | Change |
|---|---|
| `lib/db.ts` | Add `audience` column + migration |
| `app/api/products/route.ts` | Read `audience` query param |
| `app/api/products/[id]/route.ts` | Return `audience` field |
| `components/Navbar.tsx` | Add two dropdowns: "Shop All" (Men/Women/Baby) and "Products" (6 categories from API); add mobile collapsible groups; remove standalone Skincare/Makeup links |
| `app/products/page.tsx` | Add audience tab strip; dynamic page heading |

### Admin (`Admin/`)
| File | Change |
|---|---|
| `lib/db.ts` | Add `audience` column + migration |
| `app/api/products/route.ts` | Accept `audience` on create + filter by it |
| `app/api/products/[id]/route.ts` | Accept `audience` on update + return it |
| `components/ProductForm.tsx` | Add `audience` dropdown |
| `app/products/page.tsx` | Add Audience column + (optional) filter |

### Documentation (after implementation)
| File | Change |
|---|---|
| `backend.md` | Document `audience` column + new query param |
| `arong.md` | Document new dropdown nav + filter |
| `admin.md` | Document new form field + table column |

---

## 9. Open Questions Before Implementation

1. **Dropdown trigger:** Open on **hover** (desktop) + tap (mobile), or **click only** on both?
2. **Show "All Products" inside the dropdown?** Yes (recommended) — gives a clear way to see everything. Or skip and let users click "Shop All" itself?
3. **Page heading on `/products`:** Show dynamic title like `Men's Products` based on filter? Yes / No
4. **Existing 50+ seeded products:** Default all to `unisex`, or pre-tag obvious ones (lipstick → women, baby items → baby)?
5. **Product detail "For: Women" line:** Yes / No (recommendation: No — keeps page clean)
6. **Admin list — Audience filter dropdown:** Yes / No (recommendation: Yes — useful for inventory management)

---

## 10. Effort Summary

| Area | Complexity |
|---|---|
| Database migration | Trivial (1 ALTER) |
| API changes | Low (3 files, additive) |
| Admin form & list | Low (1 dropdown, 1 column) |
| Storefront navbar dropdown | Medium-Low (new dropdown component, mobile collapsible) |
| Storefront filter tabs + heading | Low (mirror existing pattern) |
| **Total** | **Small-to-medium feature** — no design system changes, no new dependencies, no breaking API changes. |

---

## 11. Approval Checklist

Before implementation, please confirm:

- [ ] Approach: Option A (`audience` column) — agreed?
- [ ] Sub-category labels: **Men / Women / Baby** — confirmed?
- [ ] Dropdown trigger: hover + tap, or click only?
- [ ] Include "All Products" inside dropdown? Yes / No
- [ ] Dynamic page heading (`Men's Products` etc)? Yes / No
- [ ] Backfill existing products: all `unisex` or pre-tag obvious ones?
- [ ] Product detail "For:" line: Yes / No
- [ ] Admin list audience filter dropdown: Yes / No

Once you answer these, I'll implement in this order:
1. Database migration
2. API changes (both apps)
3. Admin form + list
4. Storefront navbar dropdown (desktop + mobile)
5. Storefront `/products` audience tabs + heading
6. Update `backend.md` / `arong.md` / `admin.md`
