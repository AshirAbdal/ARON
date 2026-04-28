import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { findUsableCoupon, evaluateCoupon, eligibleProductIds, type CartItemInput } from '@/lib/coupons';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email';
import { sendWhatsAppOrderNotification } from '@/lib/whatsapp';

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

    const isSherpur = city && city.toLowerCase() === 'sherpur';
    const shipping_cost = isSherpur ? 0 : 120;

    const order_number = generateOrderNumber();
    const normalizedCoupon = coupon_code ? String(coupon_code).toUpperCase() : null;

    // Pre-validate coupon outside the transaction (read-only)
    let couponRow = null;
    let evalEligibleIds = new Set<number>();
    if (normalizedCoupon) {
      couponRow = await findUsableCoupon(normalizedCoupon);
      if (couponRow) {
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
        evalEligibleIds = await eligibleProductIds(couponRow, cartForEval);
      }
    }

    const conn = await pool.getConnection();
    let orderId: number;
    let total: number;
    let finalDiscount = 0;
    let appliedCoupon: string | null = null;

    try {
      await conn.beginTransaction();

      // Atomic coupon reservation
      if (couponRow && normalizedCoupon) {
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
        const evalResult = evaluateCoupon(couponRow, cartForEval, evalEligibleIds);

        if (evalResult.ok && evalResult.discount > 0) {
          const [reserve] = await conn.execute<ResultSetHeader>(
            `UPDATE coupons
                SET used_count = used_count + 1
              WHERE id = ?
                AND is_active = 1
                AND (expires_at IS NULL OR expires_at > NOW())
                AND (max_uses IS NULL OR used_count < max_uses)`,
            [couponRow.id]
          );

          if (reserve.affectedRows === 1) {
            finalDiscount = evalResult.discount;
            if (finalDiscount > subtotal) finalDiscount = subtotal;
            appliedCoupon = normalizedCoupon;
          }
        }
      }

      total = subtotal + shipping_cost - finalDiscount;

      const [orderResult] = await conn.execute<ResultSetHeader>(`
        INSERT INTO orders (order_number, full_name, phone, email, address, city, division,
          subtotal, shipping_cost, discount, total, payment_method, notes, coupon_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        order_number, full_name, phone, email || null, address, city, division,
        subtotal, shipping_cost, finalDiscount, total, payment_method,
        notes || null, appliedCoupon,
      ]);

      orderId = orderResult.insertId;

      for (const item of items) {
        await conn.execute(`
          INSERT INTO order_items (order_id, product_id, product_name, variant_name, quantity, price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.product_id || null,
          item.product_name,
          item.variant_name || null,
          item.quantity,
          item.price,
        ]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const orderItemsForNotify = items.map(
      (it: { product_name: string; variant_name?: string | null; quantity: number; price: number }) => ({
        product_name: it.product_name,
        variant_name: it.variant_name || null,
        quantity: it.quantity,
        price: it.price,
      })
    );

    const baseOrderPayload = {
      order_number,
      full_name,
      phone,
      address,
      city,
      division,
      notes: notes || null,
      payment_method,
      items: orderItemsForNotify,
      subtotal,
      shipping_cost,
      discount: finalDiscount,
      total,
      coupon_code: appliedCoupon,
    };

    if (email) {
      sendOrderConfirmationEmail({ ...baseOrderPayload, to: email }).catch((err) => {
        console.error('[orders] Failed to send customer email:', err);
      });
    }

    sendAdminOrderNotification({ ...baseOrderPayload, to: email || '' }).catch((err) => {
      console.error('[orders] Failed to send admin email:', err);
    });

    sendWhatsAppOrderNotification({ ...baseOrderPayload, email: email || null }).catch((err) => {
      console.error('[orders] Failed to send WhatsApp:', err);
    });

    return NextResponse.json({ order_number, order_id: orderId, total }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
