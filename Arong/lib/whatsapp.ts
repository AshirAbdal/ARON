// WhatsApp order notifications via Meta WhatsApp Cloud API (Official & Free)
//
// ─── SETUP GUIDE ────────────────────────────────────────────────────────────
//
// STEP 1 — Create Meta Developer App
//   1. Go to https://developers.facebook.com
//   2. Click "My Apps" → "Create App"
//   3. Choose app type: "Business"
//   4. Give it a name (e.g., "ARON Notifications")
//   5. Click "Next" → attach a Meta Business Account (create one if needed)
//
// STEP 2 — Add WhatsApp to your App
//   1. Inside your app dashboard, click "Add Product"
//   2. Find "WhatsApp" → click "Set Up"
//   3. You now have a WhatsApp Business Account (WABA) automatically created
//
// STEP 3 — Get Phone Number ID
//   1. Go to WhatsApp → API Setup in the left menu
//   2. Under "Send and receive messages", copy the "Phone number ID"
//      → This is your META_WA_PHONE_NUMBER_ID
//   3. Note: This is a FREE Meta test number (+1 555 xxx xxxx) initially
//
// STEP 4 — Add your personal WhatsApp as test recipient
//   1. In WhatsApp → API Setup → "To" field
//   2. Click "Manage phone number list"
//   3. Add your personal number (+8801XXXXXXXXX)
//   4. You'll receive a WhatsApp OTP to verify it
//
// STEP 5 — Generate Permanent Access Token
//   1. Go to Meta Business Suite → Settings → System Users
//      URL: https://business.facebook.com/settings/system-users
//   2. Create a System User with "Admin" role
//   3. Click "Generate New Token"
//   4. Select your app → grant whatsapp_business_messaging permission
//   5. Copy the token → this is your META_WA_ACCESS_TOKEN
//   NOTE: This token does NOT expire (unlike temp tokens)
//
// STEP 6 — Create Message Template
//   1. Go to WhatsApp → Message Templates → "Create Template"
//   2. Category: "Utility"
//   3. Name: "order_alert" (lowercase, underscores only)
//   4. Language: English
//   5. Body text:
//        New order *#{{1}}* received!
//
//        👤 {{2}}
//        📞 {{3}}
//        📍 {{4}}
//
//        🛒 Items: {{5}}
//        💰 Total: BDT {{6}}
//        💳 Payment: {{7}}
//   6. Submit for review — usually approved within a few minutes
//   7. Once approved, use template name: "order_alert"
//
// STEP 7 — Set environment variables in Arong/.env.local:
//   META_WA_ACCESS_TOKEN=your_permanent_system_user_token
//   META_WA_PHONE_NUMBER_ID=your_phone_number_id
//   META_WA_RECIPIENT_PHONE=+8801XXXXXXXXX   (your personal WhatsApp)
//   META_WA_TEMPLATE_NAME=order_alert
//   META_WA_TEMPLATE_LANG=en
//
// ─── FREE TIER ───────────────────────────────────────────────────────────────
//   - 1,000 free conversations per month
//   - Each conversation = 24-hour window of messages
//   - For a small shop, this means ~1,000 orders/month FREE
//
// ─── ARCHITECTURE ────────────────────────────────────────────────────────────
//   Order placed → orders/route.ts → sendMetaWhatsAppNotification()
//                                  → Meta Cloud API → Your WhatsApp
//   External trigger → POST /api/webhook/order-notify (secured)
//                    → sendMetaWhatsAppNotification()
// ─────────────────────────────────────────────────────────────────────────────

export type MetaWhatsAppOrderPayload = {
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

function formatItems(items: MetaWhatsAppOrderPayload['items']): string {
  return items
    .map((it) => {
      const name = it.variant_name ? `${it.product_name} (${it.variant_name})` : it.product_name;
      return `${name} x${it.quantity}`;
    })
    .join(', ');
}

function formatTotal(order: MetaWhatsAppOrderPayload): string {
  return String(order.total);
}

function formatAddress(order: MetaWhatsAppOrderPayload): string {
  return `${order.address}, ${order.city}, ${order.division}`;
}

/**
 * Send WhatsApp notification via Meta WhatsApp Cloud API (Official)
 *
 * API Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 * Endpoint: POST https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages
 */
export async function sendMetaWhatsAppNotification(
  order: MetaWhatsAppOrderPayload
): Promise<void> {
  const accessToken = process.env.META_WA_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const recipientPhone = process.env.META_WA_RECIPIENT_PHONE;
  const templateName = process.env.META_WA_TEMPLATE_NAME || 'order_alert';
  const templateLang = process.env.META_WA_TEMPLATE_LANG || 'en';

  if (!accessToken || !phoneNumberId || !recipientPhone) {
    console.warn(
      '[whatsapp-meta] Missing credentials. Set META_WA_ACCESS_TOKEN, META_WA_PHONE_NUMBER_ID, and META_WA_RECIPIENT_PHONE in .env.local'
    );
    return;
  }

  // Strip + from recipient phone (Meta expects E.164 without +)
  const cleanRecipient = recipientPhone.replace(/^\+/, '');

  // Template parameters — order must match your template placeholders {{1}} {{2}} ...
  const templateParams = [
    order.order_number,          // {{1}} order number
    order.full_name,             // {{2}} customer name
    order.phone,                 // {{3}} customer phone
    formatAddress(order),        // {{4}} delivery address
    formatItems(order.items),    // {{5}} items list
    formatTotal(order),          // {{6}} total amount
    order.payment_method.replace(/_/g, ' '), // {{7}} payment method
  ];

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: cleanRecipient,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: 'body',
          parameters: templateParams.map((value) => ({ type: 'text', text: String(value) })),
        },
      ],
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      messages?: { id: string }[];
      error?: { message: string; code: number; type: string };
    };

    if (response.ok && data.messages?.[0]?.id) {
      console.log('[whatsapp-meta] Notification sent. Message ID:', data.messages[0].id);
    } else if (data.error) {
      console.error('[whatsapp-meta] Meta API error:', data.error.message, '| Code:', data.error.code);
    } else {
      console.error('[whatsapp-meta] Unexpected response:', response.status, data);
    }
  } catch (err) {
    console.error('[whatsapp-meta] Network error:', err);
  }
}
