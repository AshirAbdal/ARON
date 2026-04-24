import db from './db';

export type CouponScope = 'cart' | 'category' | 'product';
export type CouponApplyTo = 'eligible' | 'cart';
export type CouponDiscountType = 'percentage' | 'fixed';

export interface CartItemInput {
  product_id: number | null;
  price: number;
  quantity: number;
}

export interface CouponRow {
  id: number;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  is_active: number;
  expires_at: string | null;
  scope: CouponScope;
  apply_to: CouponApplyTo;
}

export interface CouponEvalResult {
  ok: boolean;
  error?: string;
  discount: number;
  eligibleSubtotal: number;
}

/**
 * Returns coupon row if usable (active, not expired, slot available),
 * or null if not. Does NOT lock or reserve.
 */
export function findUsableCoupon(code: string): CouponRow | null {
  const row = db
    .prepare(
      `SELECT id, code, discount_type, discount_value, min_order, max_uses,
              used_count, is_active, expires_at, scope, apply_to
         FROM coupons
        WHERE code = ?
          AND is_active = 1
          AND (max_uses IS NULL OR used_count < max_uses)
          AND (expires_at IS NULL OR expires_at > datetime('now'))`
    )
    .get(code.toUpperCase()) as CouponRow | undefined;
  return row || null;
}

/** Returns the set of product_ids (in this cart) that are eligible for the coupon. */
export function eligibleProductIds(coupon: CouponRow, items: CartItemInput[]): Set<number> {
  if (coupon.scope === 'cart') {
    return new Set(items.map((i) => i.product_id).filter((x): x is number => typeof x === 'number'));
  }

  const targets = db
    .prepare(`SELECT target_id FROM coupon_targets WHERE coupon_id = ? AND target_type = ?`)
    .all(coupon.id, coupon.scope) as { target_id: number }[];
  const targetIds = new Set(targets.map((t) => t.target_id));

  if (coupon.scope === 'product') {
    return new Set(
      items
        .map((i) => i.product_id)
        .filter((id): id is number => typeof id === 'number' && targetIds.has(id))
    );
  }

  // scope === 'category': resolve products to their category
  const productIds = items
    .map((i) => i.product_id)
    .filter((id): id is number => typeof id === 'number');
  if (productIds.length === 0) return new Set();

  const placeholders = productIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT id, category_id FROM products WHERE id IN (${placeholders})`
    )
    .all(...productIds) as { id: number; category_id: number | null }[];

  return new Set(
    rows
      .filter((r) => r.category_id !== null && targetIds.has(r.category_id))
      .map((r) => r.id)
  );
}

/** Pure calculation: never mutates DB. */
export function evaluateCoupon(
  coupon: CouponRow,
  items: CartItemInput[]
): CouponEvalResult {
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const eligibleIds = eligibleProductIds(coupon, items);

  const eligibleSubtotal = items.reduce((s, it) => {
    if (it.product_id !== null && eligibleIds.has(it.product_id)) {
      return s + it.price * it.quantity;
    }
    return s;
  }, 0);

  if (eligibleSubtotal === 0) {
    return {
      ok: false,
      error: "This coupon doesn't apply to any item in your cart",
      discount: 0,
      eligibleSubtotal: 0,
    };
  }

  if (eligibleSubtotal < coupon.min_order) {
    return {
      ok: false,
      error: `Minimum eligible amount is ৳${coupon.min_order} for this coupon`,
      discount: 0,
      eligibleSubtotal,
    };
  }

  let discount =
    coupon.discount_type === 'percentage'
      ? Math.round((eligibleSubtotal * coupon.discount_value) / 100)
      : coupon.discount_value;

  // Cap so discount never exceeds what it can apply to
  const cap = coupon.apply_to === 'cart' ? subtotal : eligibleSubtotal;
  if (discount > cap) discount = cap;

  return { ok: true, discount, eligibleSubtotal };
}
