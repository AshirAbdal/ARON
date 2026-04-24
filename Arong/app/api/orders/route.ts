import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { findUsableCoupon, evaluateCoupon, type CartItemInput } from '@/lib/coupons';

function generateOrderNumber(): string {
  const prefix = 'ARG';
  const timestamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name, phone, email, address, city, division, notes,
      coupon_code, items, payment_method = 'cash_on_delivery',
    } = body;

    if (!full_name || !phone || !address || !city || !division) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    // Shipping cost
    const isSherpur = city && city.toLowerCase() === 'sherpur';
    const shipping_cost = isSherpur ? 0 : 120;

    const order_number = generateOrderNumber();
    const normalizedCoupon = coupon_code ? String(coupon_code).toUpperCase() : null;

    const placeOrder = db.transaction(() => {
      // Re-validate the coupon server-side using the actual cart and the
      // scoping rules (cart / category / product). The atomic reserve UPDATE
      // guarantees `used_count < max_uses` even under concurrent placement.
      let discount = 0;
      let appliedCoupon: string | null = null;

      if (normalizedCoupon) {
        const coupon = findUsableCoupon(normalizedCoupon);
        if (coupon) {
          const cartForEval: CartItemInput[] = items.map(
            (it: { product_id?: number | null; price: number; quantity: number }) => ({
              product_id:
                typeof it.product_id === 'number' && Number.isInteger(it.product_id)
                  ? it.product_id
                  : null,
              price: Number(it.price) || 0,
              quantity: Math.max(1, Math.floor(Number(it.quantity) || 0)),
            })
          );
          const evalResult = evaluateCoupon(coupon, cartForEval);

          if (evalResult.ok && evalResult.discount > 0) {
            // Atomic reserve: only increments if a slot is still available.
            const reserve = db
              .prepare(
                `UPDATE coupons
                    SET used_count = used_count + 1
                  WHERE id = ?
                    AND is_active = 1
                    AND (expires_at IS NULL OR expires_at > datetime('now'))
                    AND (max_uses IS NULL OR used_count < max_uses)`
              )
              .run(coupon.id);

            if (reserve.changes === 1) {
              discount = evalResult.discount;
              if (discount > subtotal) discount = subtotal;
              appliedCoupon = normalizedCoupon;
            }
          }
        }
      }

      const total = subtotal + shipping_cost - discount;

      const orderResult = db.prepare(`
        INSERT INTO orders (order_number, full_name, phone, email, address, city, division,
          subtotal, shipping_cost, discount, total, payment_method, notes, coupon_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        order_number, full_name, phone, email || null, address, city, division,
        subtotal, shipping_cost, discount, total, payment_method,
        notes || null, appliedCoupon
      );

      const orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, variant_name, quantity, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(
          orderId,
          item.product_id || null,
          item.product_name,
          item.variant_name || null,
          item.quantity,
          item.price
        );
      }

      return { orderId, total };
    });

    const { orderId, total } = placeOrder();
    return NextResponse.json({ order_number, order_id: orderId, total }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
