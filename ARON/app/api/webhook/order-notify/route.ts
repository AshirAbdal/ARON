import { NextRequest, NextResponse } from 'next/server';
import { sendMetaWhatsAppNotification, type MetaWhatsAppOrderPayload } from '@/lib/whatsapp';

/**
 * Secured Webhook Endpoint for WhatsApp Order Notifications
 *
 * POST /api/webhook/order-notify
 *
 * Protected by X-Webhook-Secret header.
 * Can be triggered:
 *   1. Internally — from orders/route.ts after successful order creation
 *   2. Externally — from any system (Postman, other services) with the secret
 *
 * Test with curl:
 *   curl -X POST https://yourdomain.com/api/webhook/order-notify \
 *     -H "Content-Type: application/json" \
 *     -H "X-Webhook-Secret: your_webhook_secret" \
 *     -d '{"order_number":"ORD-001","full_name":"Test","phone":"+8801712345678",
 *          "address":"123 Street","city":"Dhaka","division":"Dhaka",
 *          "payment_method":"cash_on_delivery","total":2500,"subtotal":2000,
 *          "shipping_cost":60,"discount":0,
 *          "items":[{"product_name":"Test Product","quantity":2,"price":1000}]}'
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Validate webhook secret ────────────────────────────────────────────
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const incomingSecret = req.headers.get('x-webhook-secret');

  if (!webhookSecret) {
    console.error('[webhook/order-notify] WEBHOOK_SECRET not set in environment.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (!incomingSecret || incomingSecret !== webhookSecret) {
    console.warn('[webhook/order-notify] Rejected request: invalid or missing secret.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse and validate payload ────────────────────────────────────────
  let order: MetaWhatsAppOrderPayload;

  try {
    order = (await req.json()) as MetaWhatsAppOrderPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Basic field validation
  if (
    !order.order_number ||
    !order.full_name ||
    !order.phone ||
    !order.address ||
    !order.payment_method ||
    typeof order.total !== 'number' ||
    !Array.isArray(order.items) ||
    order.items.length === 0
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: order_number, full_name, phone, address, payment_method, total, items' },
      { status: 400 }
    );
  }

  // ── 3. Send WhatsApp notification ─────────────────────────────────────────
  try {
    await sendMetaWhatsAppNotification(order);
    return NextResponse.json({ success: true, order_number: order.order_number }, { status: 200 });
  } catch (err) {
    console.error('[webhook/order-notify] Failed to send notification:', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// Reject all other methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
