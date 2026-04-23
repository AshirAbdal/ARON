import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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
      full_name, phone, address, city, division, notes,
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

    // Coupon
    let discount = 0;
    let validCoupon = null;
    if (coupon_code) {
      validCoupon = db
        .prepare(
          `SELECT * FROM coupons WHERE code = ? AND is_active = 1
           AND (max_uses IS NULL OR used_count < max_uses)
           AND (expires_at IS NULL OR expires_at > datetime('now'))`
        )
        .get(coupon_code.toUpperCase()) as { id: number; discount_type: string; discount_value: number; min_order: number } | undefined;

      if (validCoupon && subtotal >= validCoupon.min_order) {
        if (validCoupon.discount_type === 'percentage') {
          discount = Math.round((subtotal * validCoupon.discount_value) / 100);
        } else {
          discount = validCoupon.discount_value;
        }
      }
    }

    const total = subtotal + shipping_cost - discount;
    const order_number = generateOrderNumber();

    const placeOrder = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (order_number, full_name, phone, address, city, division,
          subtotal, shipping_cost, discount, total, payment_method, notes, coupon_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        order_number, full_name, phone, address, city, division,
        subtotal, shipping_cost, discount, total, payment_method,
        notes || null, coupon_code || null
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

      if (validCoupon) {
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(
          validCoupon.id
        );
      }

      return orderId;
    });

    const orderId = placeOrder();
    return NextResponse.json({ order_number, order_id: orderId, total }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
