import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { setCouponTargets, getCouponTargets, type CouponScope } from '@/lib/couponTargets';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  }
  const targets = getCouponTargets(id);
  return NextResponse.json({ coupon, targets });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (typeof body.is_active === 'boolean' || body.is_active === 0 || body.is_active === 1) {
    fields.push('is_active = ?');
    values.push(body.is_active ? 1 : 0);
  }
  if (body.discount_value !== undefined) {
    const v = Number(body.discount_value);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: 'discount_value must be > 0' }, { status: 400 });
    }
    fields.push('discount_value = ?');
    values.push(v);
  }
  if (body.min_order !== undefined) {
    fields.push('min_order = ?');
    values.push(Number(body.min_order) || 0);
  }
  if (body.max_uses !== undefined) {
    const v = body.max_uses === null || body.max_uses === '' ? null : Number(body.max_uses);
    if (v !== null && (!Number.isInteger(v) || v <= 0)) {
      return NextResponse.json({ error: 'max_uses must be a positive integer' }, { status: 400 });
    }
    fields.push('max_uses = ?');
    values.push(v);
  }
  if (body.expires_at !== undefined) {
    let expiresAtSql: string | null = null;
    if (body.expires_at) {
      const d = new Date(body.expires_at);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid expires_at' }, { status: 400 });
      }
      expiresAtSql = d.toISOString().replace('T', ' ').slice(0, 19);
    }
    fields.push('expires_at = ?');
    values.push(expiresAtSql);
  }

  // Scope + apply_to (optional)
  let scopeChange: CouponScope | null = null;
  if (body.scope !== undefined) {
    if (body.scope !== 'cart' && body.scope !== 'category' && body.scope !== 'product') {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    }
    fields.push('scope = ?');
    values.push(body.scope);
    scopeChange = body.scope;
  }
  if (body.apply_to !== undefined) {
    if (body.apply_to !== 'eligible' && body.apply_to !== 'cart') {
      return NextResponse.json({ error: 'Invalid apply_to' }, { status: 400 });
    }
    fields.push('apply_to = ?');
    values.push(body.apply_to);
  }

  const targetsProvided =
    Array.isArray(body.target_product_ids) || Array.isArray(body.target_category_ids);

  if (fields.length === 0 && !targetsProvided) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const update = db.transaction(() => {
    if (fields.length > 0) {
      values.push(id);
      const result = db
        .prepare(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`)
        .run(...values);
      if (result.changes === 0) throw new Error('NOT_FOUND');
    }
    if (targetsProvided) {
      // Need scope to know which target list to use; use new scope or current scope.
      const current = db.prepare('SELECT scope FROM coupons WHERE id = ?').get(id) as
        | { scope: CouponScope }
        | undefined;
      if (!current) throw new Error('NOT_FOUND');
      const effectiveScope = scopeChange ?? current.scope;
      setCouponTargets(
        id,
        effectiveScope,
        Array.isArray(body.target_product_ids)
          ? body.target_product_ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
          : [],
        Array.isArray(body.target_category_ids)
          ? body.target_category_ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
          : []
      );
    }
  });

  try {
    update();
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const result = db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

