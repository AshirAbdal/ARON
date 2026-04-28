import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { setCouponTargets, type CouponScope } from '@/lib/couponTargets';

export async function GET() {
  const [coupons] = await pool.execute<RowDataPacket[]>(
    `SELECT c.*,
            (SELECT COUNT(*) FROM coupon_targets t WHERE t.coupon_id = c.id) AS target_count
       FROM coupons c
      ORDER BY c.created_at DESC`
  );
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    code,
    discount_type,
    discount_value,
    min_order = 0,
    max_uses = null,
    expires_at = null,
    is_active = 1,
    scope = 'cart',
    apply_to = 'eligible',
    target_product_ids = [],
    target_category_ids = [],
  } = body || {};

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }
  if (discount_type !== 'percentage' && discount_type !== 'fixed') {
    return NextResponse.json({ error: 'discount_type must be "percentage" or "fixed"' }, { status: 400 });
  }
  const value = Number(discount_value);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: 'discount_value must be > 0' }, { status: 400 });
  }
  if (discount_type === 'percentage' && value > 100) {
    return NextResponse.json({ error: 'percentage cannot exceed 100' }, { status: 400 });
  }
  if (scope !== 'cart' && scope !== 'category' && scope !== 'product') {
    return NextResponse.json({ error: 'scope must be "cart", "category" or "product"' }, { status: 400 });
  }
  if (apply_to !== 'eligible' && apply_to !== 'cart') {
    return NextResponse.json({ error: 'apply_to must be "eligible" or "cart"' }, { status: 400 });
  }

  const productIds = Array.isArray(target_product_ids)
    ? target_product_ids.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : [];
  const categoryIds = Array.isArray(target_category_ids)
    ? target_category_ids.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : [];

  if (scope === 'product' && productIds.length === 0) {
    return NextResponse.json(
      { error: 'Select at least one product for product-scoped coupon' },
      { status: 400 }
    );
  }
  if (scope === 'category' && categoryIds.length === 0) {
    return NextResponse.json(
      { error: 'Select at least one category for category-scoped coupon' },
      { status: 400 }
    );
  }

  const minOrder = Number(min_order) || 0;
  const maxUses = max_uses === null || max_uses === '' ? null : Number(max_uses);
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
    return NextResponse.json({ error: 'max_uses must be a positive integer' }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,32}$/.test(normalizedCode)) {
    return NextResponse.json(
      { error: 'Code must be 2-32 chars, letters/digits/_/- only' },
      { status: 400 }
    );
  }

  let expiresAtSql: string | null = null;
  if (expires_at) {
    const d = new Date(expires_at);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid expires_at' }, { status: 400 });
    }
    expiresAtSql = d.toISOString().replace('T', ' ').slice(0, 19);
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses,
                            is_active, expires_at, scope, apply_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [normalizedCode, discount_type, value, minOrder, maxUses, is_active ? 1 : 0, expiresAtSql, scope, apply_to]
    );
    const newId = result.insertId;
    await setCouponTargets(newId, scope as CouponScope, productIds, categoryIds);
    return NextResponse.json({ id: newId }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('Duplicate') || message.includes('ER_DUP_ENTRY')) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
