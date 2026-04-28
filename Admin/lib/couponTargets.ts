import pool from './db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

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
export async function setCouponTargets(
  couponId: number,
  scope: CouponScope,
  productIds: number[],
  categoryIds: number[]
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM coupon_targets WHERE coupon_id = ?', [couponId]);

    if (scope === 'product') {
      for (const id of productIds) {
        await conn.execute(
          'INSERT IGNORE INTO coupon_targets (coupon_id, target_type, target_id) VALUES (?, ?, ?)',
          [couponId, 'product', id]
        );
      }
    } else if (scope === 'category') {
      for (const id of categoryIds) {
        await conn.execute(
          'INSERT IGNORE INTO coupon_targets (coupon_id, target_type, target_id) VALUES (?, ?, ?)',
          [couponId, 'category', id]
        );
      }
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getCouponTargets(couponId: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT target_type, target_id FROM coupon_targets WHERE coupon_id = ?',
    [couponId]
  );
  return rows as { target_type: 'product' | 'category'; target_id: number }[];
}
