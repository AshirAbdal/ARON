// WhatsApp notification helper using CallMeBot's free API.
// Setup (one-time):
//   1. Add +34 644 51 95 23 to your WhatsApp contacts.
//   2. Send: "I allow callmebot to send me messages"
//   3. The bot will reply with your personal API key.
//   4. Set CALLMEBOT_PHONE (international format, no +) and CALLMEBOT_API_KEY in .env.local.

export type WhatsAppOrderPayload = {
  order_number: string;
  full_name: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  division: string;
  notes?: string | null;
  payment_method: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  coupon_code?: string | null;
  items: { product_name: string; variant_name?: string | null; quantity: number; price: number }[];
};

function formatMessage(order: WhatsAppOrderPayload): string {
  const lines: string[] = [];
  lines.push(`🛒 *New Order — ${order.order_number}*`);
  lines.push('');
  lines.push(`👤 ${order.full_name}`);
  lines.push(`📞 ${order.phone}`);
  if (order.email) lines.push(`✉️ ${order.email}`);
  lines.push(`📍 ${order.address}, ${order.city}, ${order.division}`);
  if (order.notes) lines.push(`📝 Note: ${order.notes}`);
  lines.push('');
  lines.push('*Items:*');
  for (const it of order.items) {
    const name = it.variant_name ? `${it.product_name} (${it.variant_name})` : it.product_name;
    lines.push(`• ${name} x${it.quantity} — ৳${it.price * it.quantity}`);
  }
  lines.push('');
  lines.push(`Subtotal: ৳${order.subtotal}`);
  lines.push(`Shipping: ${order.shipping_cost === 0 ? 'Free' : `৳${order.shipping_cost}`}`);
  if (order.discount > 0) lines.push(`Discount: -৳${order.discount}${order.coupon_code ? ` (${order.coupon_code})` : ''}`);
  lines.push(`*Total: ৳${order.total}*`);
  lines.push(`💳 ${order.payment_method.replace(/_/g, ' ')}`);
  return lines.join('\n');
}

export async function sendWhatsAppOrderNotification(order: WhatsAppOrderPayload): Promise<void> {
  const phone = process.env.CALLMEBOT_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!phone || !apiKey) {
    console.warn('[whatsapp] CALLMEBOT_PHONE / CALLMEBOT_API_KEY not set; skipping WhatsApp notification.');
    return;
  }

  const message = formatMessage(order);
  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(message)}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { method: 'GET' });
    const body = await res.text();
    if (!res.ok) {
      console.error('[whatsapp] CallMeBot returned non-OK:', res.status, body.slice(0, 200));
      return;
    }
    // CallMeBot returns HTML. Look for failure markers.
    if (/error|invalid/i.test(body) && !/Message queued/i.test(body)) {
      console.error('[whatsapp] CallMeBot response indicates error:', body.slice(0, 300));
    }
  } catch (err) {
    console.error('[whatsapp] Failed to send:', err);
  }
}
