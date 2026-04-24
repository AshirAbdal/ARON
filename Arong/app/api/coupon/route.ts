import { NextRequest, NextResponse } from 'next/server';
import { findUsableCoupon, evaluateCoupon, type CartItemInput } from '@/lib/coupons';

/**
 * Preview coupon validity for a given cart.
 *
 * Body: { code: string, items: [{ product_id, price, quantity }] }
 *
 * (Kept POST so the cart payload can travel in the body.)
 */
export async function POST(req: NextRequest) {
  let body: { code?: string; items?: CartItemInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const code = (body.code || '').trim();
  if (!code) {
    return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // Sanitize items: only keep numeric product_id, price, quantity
  const safeItems: CartItemInput[] = items
    .map((it) => ({
      product_id:
        typeof it.product_id === 'number' && Number.isInteger(it.product_id)
          ? it.product_id
          : null,
      price: Number(it.price) || 0,
      quantity: Math.max(1, Math.floor(Number(it.quantity) || 0)),
    }))
    .filter((it) => it.price > 0 && it.quantity > 0);

  const coupon = findUsableCoupon(code);
  if (!coupon) {
    return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 });
  }

  const result = evaluateCoupon(coupon, safeItems);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    discount: result.discount,
    eligible_subtotal: result.eligibleSubtotal,
    coupon: {
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      scope: coupon.scope,
      apply_to: coupon.apply_to,
    },
  });
}
