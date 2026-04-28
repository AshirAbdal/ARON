import pool from './db';
import type { RowDataPacket } from 'mysql2';

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
export async function findUsableCoupon(code: string): Promise<CouponRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, code, discount_type, discount_value, min_order, max_uses,
            used_count, is_active, expires_at, scope, apply_to
       FROM coupons
      WHERE code = ?
        AND is_active = 1
        AND (max_uses IS NULL OR used_count < max_uses)
        AND (expires_at IS NULL OR expires_at > NOW())`,
    [code.toUpperCase()]
  );
  return (rows[0] as CouponRow) || null;
}

/** Returns the set of product_ids (in this cart) that are eligible for the coupon. */
export async function eligibleProductIds(coupon: CouponRow, items: CartItemInput[]): Promise<Set<number>> {
  if (coupon.scope === 'cart') {
    return new Set(items.map((i) => i.product_id).filter((x): x is number => typeof x === 'number'));
  }

  const [targets] = await pool.execute<RowDataPacket[]>(
    'SELECT target_id FROM coupon_targets WHERE coupon_id = ? AND target_type = ?',
    [coupon.id, coupon.scope]
  );
  const targetIds = new Set((targets as { target_id: number }[]).map((t) => t.target_id));

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
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, category_id FROM products WHERE id IN (${placeholders})`,
    productIds
  );

  return new Set(
    (rows as { id: number; category_id: number | null }[])
      .filter((r) => r.category_id !== null && targetIds.has(r.category_id!))
      .map((r) => r.id)
  );
}

/** Pure calculation: never mutates DB. */
export function evaluateCoupon(
  coupon: CouponRow,
  items: CartItemInput[],
  eligibleIds: Set<number>
): CouponEvalResult {
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);

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
