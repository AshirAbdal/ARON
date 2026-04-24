import db from './db';

export type CouponScope = 'cart' | 'category' | 'product';
export type CouponApplyTo = 'eligible' | 'cart';

export interface CouponRow {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  is_active: number;
  expires_at: string | null;
  scope: CouponScope;
  apply_to: CouponApplyTo;
}

/**
 * Replaces all targets for a coupon (atomic).
 * `productIds` used for scope='product', `categoryIds` for scope='category'.
 */
export function setCouponTargets(
  couponId: number,
  scope: CouponScope,
  productIds: number[],
  categoryIds: number[]
) {
  const replace = db.transaction(() => {
    db.prepare('DELETE FROM coupon_targets WHERE coupon_id = ?').run(couponId);

    if (scope === 'cart') return; // no targets

    const insert = db.prepare(
      'INSERT OR IGNORE INTO coupon_targets (coupon_id, target_type, target_id) VALUES (?, ?, ?)'
    );

    if (scope === 'product') {
      for (const id of productIds) insert.run(couponId, 'product', id);
    } else if (scope === 'category') {
      for (const id of categoryIds) insert.run(couponId, 'category', id);
    }
  });
  replace();
}

export function getCouponTargets(couponId: number) {
  return db
    .prepare(
      `SELECT target_type, target_id FROM coupon_targets WHERE coupon_id = ?`
    )
    .all(couponId) as { target_type: 'product' | 'category'; target_id: number }[];
}
