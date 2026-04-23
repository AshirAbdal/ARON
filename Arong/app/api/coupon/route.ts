import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const subtotal = parseFloat(searchParams.get('subtotal') || '0');

  if (!code) {
    return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
  }

  const coupon = db
    .prepare(
      `SELECT * FROM coupons WHERE code = ? AND is_active = 1
       AND (max_uses IS NULL OR used_count < max_uses)
       AND (expires_at IS NULL OR expires_at > datetime('now'))`
    )
    .get(code.toUpperCase()) as {
    id: number;
    discount_type: string;
    discount_value: number;
    min_order: number;
  } | undefined;

  if (!coupon) {
    return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 });
  }
  if (subtotal < coupon.min_order) {
    return NextResponse.json(
      { error: `Minimum order amount is ৳${coupon.min_order} for this coupon` },
      { status: 400 }
    );
  }

  const discount =
    coupon.discount_type === 'percentage'
      ? Math.round((subtotal * coupon.discount_value) / 100)
      : coupon.discount_value;

  return NextResponse.json({ valid: true, discount, coupon });
}
