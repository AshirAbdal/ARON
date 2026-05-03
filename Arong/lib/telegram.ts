// Telegram notification helper using the Telegram Bot API.
//
// Setup (one-time, takes ~2 minutes):
//   1. Open Telegram and search for @BotFather
//   2. Send /newbot — give it any name and username (e.g. AronShopBot)
//   3. BotFather will give you a TOKEN — copy it
//   4. Open https://t.me/your_bot_username and press Start
//   5. Visit: https://api.telegram.org/bot<TOKEN>/getUpdates
//      You'll see your chat_id in the JSON (look for "id" inside "chat")
//   6. Set in Admin/.env.local AND Arong/.env.local:
//        TELEGRAM_BOT_TOKEN=123456:ABC-your-token
//        TELEGRAM_CHAT_ID=your_chat_id

export type TelegramOrderPayload = {
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

function formatMessage(order: TelegramOrderPayload): string {
  const lines: string[] = [];
  lines.push(`🛒 <b>New Order — ${order.order_number}</b>`);
  lines.push('');
  lines.push(`👤 ${order.full_name}`);
  lines.push(`📞 ${order.phone}`);
  if (order.email) lines.push(`✉️ ${order.email}`);
  lines.push(`📍 ${order.address}, ${order.city}, ${order.division}`);
  if (order.notes) lines.push(`📝 Note: ${order.notes}`);
  lines.push('');
  lines.push('<b>Items:</b>');
  for (const it of order.items) {
    const name = it.variant_name ? `${it.product_name} (${it.variant_name})` : it.product_name;
    lines.push(`• ${name} ×${it.quantity} — ৳${(it.price * it.quantity).toFixed(2)}`);
  }
  lines.push('');
  lines.push(`Subtotal: ৳${order.subtotal}`);
  lines.push(`Shipping: ${order.shipping_cost === 0 ? 'Free' : `৳${order.shipping_cost}`}`);
  if (order.discount > 0) {
    lines.push(`Discount: -৳${order.discount}${order.coupon_code ? ` (${order.coupon_code})` : ''}`);
  }
  lines.push(`<b>Total: ৳${order.total}</b>`);
  lines.push(`💳 ${order.payment_method.replace(/_/g, ' ')}`);
  return lines.join('\n');
}

export async function sendTelegramOrderNotification(order: TelegramOrderPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set; skipping Telegram notification.');
    return;
  }

  const text = formatMessage(order);
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) {
      console.error('[telegram] Telegram API error:', data.description);
    }
  } catch (err) {
    console.error('[telegram] Failed to send:', err);
  }
}
