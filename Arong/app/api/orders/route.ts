import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { findUsableCoupon, evaluateCoupon, eligibleProductIds, type CartItemInput } from '@/lib/coupons';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import { sendMetaWhatsAppNotification } from '@/lib/whatsapp';
import { applyRateLimit } from '@/lib/rateLimit';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { getFraudSignal, logSuspiciousOrder } from '@/lib/fraud';

const MAX_CART_LINES = Number(process.env.MAX_CART_LINES || 20);
const MAX_QTY_PER_LINE = Number(process.env.MAX_QTY_PER_LINE || 10);
const MAX_TOTAL_QTY = Number(process.env.MAX_TOTAL_QTY || 30);
const MAX_ORDER_VALUE = Number(process.env.MAX_ORDER_VALUE || 80000);
const MAX_ORDERS_PER_PHONE_WINDOW = Number(process.env.MAX_ORDERS_PER_PHONE_WINDOW || 3);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'temp-mail.org',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com',
  'tempmail.com',
]);

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function isLikelyValidEmail(email: string): boolean {
  if (!EMAIL_REGEX.test(email)) return false;
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return !DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

function generateOrderNumber(): string {
  const prefix = 'ARG';
  const timestamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const rate = applyRateLimit(`create-order:${ip}`, 20, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many order attempts. Please try again in a few minutes.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json();
    const {
      full_name, phone, email, address, city, division, notes,
      coupon_code, items, payment_method = 'cash_on_delivery', captcha_token,
    } = body;

    if (!full_name || !phone || !address || !city || !division) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeName = String(full_name).trim();
    const safePhone = normalizePhone(String(phone));
    const safeAddress = String(address).trim();
    const safeEmail = email ? String(email).trim().toLowerCase() : '';
    const safeCity = String(city).trim();
    const safeDivision = String(division).trim();

    if (safeName.length < 2 || safeName.length > 100) {
      return NextResponse.json({ error: 'Invalid full name' }, { status: 400 });
    }
    if (!BD_PHONE_REGEX.test(safePhone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }
    if (!safeEmail || !isLikelyValidEmail(safeEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (safeAddress.length < 10 || safeAddress.length > 500) {
      return NextResponse.json({ error: 'Invalid delivery address' }, { status: 400 });
    }
    if (safeCity.length < 2 || safeCity.length > 100 || safeDivision.length < 2 || safeDivision.length > 100) {
      return NextResponse.json({ error: 'Invalid city or division' }, { status: 400 });
    }

    const captchaCheck = await verifyTurnstileToken(
      String(captcha_token || ''),
      ip === 'unknown' ? undefined : ip
    );
    if (!captchaCheck.ok) {
      return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (items.length > MAX_CART_LINES) {
      return NextResponse.json({ error: 'Too many unique products in one order' }, { status: 400 });
    }

    const [recentPhoneOrders] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS c
         FROM orders
        WHERE phone = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
      [safePhone]
    );
    const recentByPhone = Number((recentPhoneOrders[0] as { c: number }).c || 0);
    if (recentByPhone >= MAX_ORDERS_PER_PHONE_WINDOW) {
      return NextResponse.json(
        { error: 'Too many orders from this phone in a short time. Please try later.' },
        { status: 429 }
      );
    }

    const [totalByPhoneRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM orders WHERE phone = ?`,
      [safePhone]
    );
    const totalByPhone = Number((totalByPhoneRows[0] as { c: number }).c || 0);

    const paymentMethod = String(payment_method || 'cash_on_delivery');
    const allowedPaymentMethods = new Set(['cash_on_delivery']);
    if (!allowedPaymentMethods.has(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const normalizedItems: {
      product_id: number;
      product_name: string;
      variant_id: number | null;
      variant_name: string | null;
      quantity: number;
      price: number;
    }[] = [];

    for (const rawItem of items as Array<{ product_id?: number; variant_id?: number; quantity?: number }>) {
      const productId = Number(rawItem.product_id);
      const quantity = Math.max(1, Math.floor(Number(rawItem.quantity) || 0));
      const variantId =
        typeof rawItem.variant_id === 'number' && Number.isInteger(rawItem.variant_id)
          ? rawItem.variant_id
          : null;

      if (!Number.isInteger(productId) || productId <= 0 || quantity <= 0) {
        return NextResponse.json({ error: 'Invalid cart item payload' }, { status: 400 });
      }
      if (quantity > MAX_QTY_PER_LINE) {
        return NextResponse.json(
          { error: `Quantity per item cannot exceed ${MAX_QTY_PER_LINE}` },
          { status: 400 }
        );
      }

      if (variantId) {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT p.id AS product_id, p.name AS product_name,
                  pv.id AS variant_id, pv.name AS variant_name, pv.price AS unit_price
             FROM products p
             JOIN product_variants pv ON pv.product_id = p.id
            WHERE p.id = ? AND pv.id = ?
            LIMIT 1`,
          [productId, variantId]
        );
        const row = rows[0] as
          | {
              product_id: number;
              product_name: string;
              variant_id: number;
              variant_name: string;
              unit_price: number;
            }
          | undefined;

        if (!row) {
          return NextResponse.json({ error: 'Invalid product variant in cart' }, { status: 400 });
        }

        normalizedItems.push({
          product_id: row.product_id,
          product_name: row.product_name,
          variant_id: row.variant_id,
          variant_name: row.variant_name,
          quantity,
          price: Number(row.unit_price),
        });
        continue;
      }

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id AS product_id, name AS product_name, price_min AS unit_price
           FROM products
          WHERE id = ?
          LIMIT 1`,
        [productId]
      );
      const row = rows[0] as
        | {
            product_id: number;
            product_name: string;
            unit_price: number;
          }
        | undefined;

      if (!row) {
        return NextResponse.json({ error: 'Invalid product in cart' }, { status: 400 });
      }

      normalizedItems.push({
        product_id: row.product_id,
        product_name: row.product_name,
        variant_id: null,
        variant_name: null,
        quantity,
        price: Number(row.unit_price),
      });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalQty = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQty > MAX_TOTAL_QTY) {
      return NextResponse.json({ error: `Total quantity cannot exceed ${MAX_TOTAL_QTY}` }, { status: 400 });
    }
    if (subtotal > MAX_ORDER_VALUE) {
      return NextResponse.json(
        { error: 'High-value order detected. Please contact support to complete this order.' },
        { status: 400 }
      );
    }

    const isSherpur = safeCity.toLowerCase() === 'sherpur';
    const shipping_cost = isSherpur ? 0 : 120;

    const preCouponFraudSignal = getFraudSignal({
      total: subtotal + shipping_cost,
      totalQty,
      isFirstOrderByPhone: totalByPhone === 0,
      recentByPhone,
      city: safeCity,
      address: safeAddress,
    });

    if (preCouponFraudSignal.score >= 70) {
      await logSuspiciousOrder({
        fullName: safeName,
        phone: safePhone,
        email: safeEmail,
        ip,
        score: preCouponFraudSignal.score,
        reasons: preCouponFraudSignal.reasons,
      });

      return NextResponse.json(
        { error: 'Order requires manual verification. Please contact support.' },
        { status: 400 }
      );
    }

    const order_number = generateOrderNumber();
    const normalizedCoupon = coupon_code ? String(coupon_code).toUpperCase() : null;

    // Pre-validate coupon outside the transaction (read-only)
    let couponRow = null;
    let evalEligibleIds = new Set<number>();
    if (normalizedCoupon) {
      couponRow = await findUsableCoupon(normalizedCoupon);
      if (couponRow) {
        const cartForEval: CartItemInput[] = normalizedItems.map(
          (it) => ({
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
        const cartForEval: CartItemInput[] = normalizedItems.map(
          (it) => ({
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
        order_number, safeName, safePhone, safeEmail || null, safeAddress, safeCity, safeDivision,
        subtotal, shipping_cost, finalDiscount, total, paymentMethod,
        notes || null, appliedCoupon,
      ]);

      orderId = orderResult.insertId;

      for (const item of normalizedItems) {
        await conn.execute(`
          INSERT INTO order_items (order_id, product_id, product_name, variant_name, quantity, price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.product_id,
          item.product_name,
          item.variant_name || null,
          item.quantity,
          item.price,
        ]);
      }

      await conn.commit();

      const fraudSignal = getFraudSignal({
        total,
        totalQty,
        isFirstOrderByPhone: totalByPhone === 0,
        recentByPhone,
        city: safeCity,
        address: safeAddress,
      });

      if (fraudSignal.score >= 35) {
        await logSuspiciousOrder({
          orderId,
          orderNumber: order_number,
          fullName: safeName,
          phone: safePhone,
          email: safeEmail,
          ip,
          score: fraudSignal.score,
          reasons: fraudSignal.reasons,
        });
      }
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const orderItemsForNotify = normalizedItems.map(
      (it) => ({
        product_name: it.product_name,
        variant_name: it.variant_name || null,
        quantity: it.quantity,
        price: it.price,
      })
    );

    const baseOrderPayload = {
      order_number,
      full_name: safeName,
      phone: safePhone,
      address: safeAddress,
      city: safeCity,
      division: safeDivision,
      notes: notes || null,
      payment_method: paymentMethod,
      items: orderItemsForNotify,
      subtotal,
      shipping_cost,
      discount: finalDiscount,
      total,
      coupon_code: appliedCoupon,
    };

    if (safeEmail) {
      sendOrderConfirmationEmail({ ...baseOrderPayload, to: safeEmail }).catch((err) => {
        console.error('[orders] Failed to send customer email:', err);
      });
    }

    sendAdminOrderNotification({ ...baseOrderPayload, to: safeEmail || '' }).catch((err) => {
      console.error('[orders] Failed to send admin email:', err);
    });

    sendTelegramOrderNotification({ ...baseOrderPayload, email: safeEmail || null }).catch((err) => {
      console.error('[orders] Failed to send Telegram:', err);
    });

    sendMetaWhatsAppNotification({ ...baseOrderPayload, email: safeEmail || null }).catch((err) => {
      console.error('[orders] Failed to send WhatsApp notification:', err);
    });

    return NextResponse.json({ order_number, order_id: orderId, total }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
