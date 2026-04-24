# bKash Payment Gateway Integration Guide (Arong Storefront)

A complete, production-ready model for integrating **bKash Tokenized Checkout (PGW)** into your Next.js (App Router) storefront, using your existing order flow in [Arong/app/api/orders/route.ts](Arong/app/api/orders/route.ts) and [Arong/app/checkout/page.tsx](Arong/app/checkout/page.tsx).

---

## 1. What you need from bKash (Merchant onboarding)

Once your bKash **Merchant Account** is approved for PGW, bKash will provide:

| Credential | Used for | Where to keep |
|---|---|---|
| `App Key` | Identifies your app | `.env.local` |
| `App Secret` | Signs token requests | `.env.local` |
| `Username` | API auth | `.env.local` |
| `Password` | API auth | `.env.local` |
| Merchant Number | Display / reconciliation | DB / config |
| Sandbox + Live base URLs | API calls | `.env.local` |

> Sandbox base URL: `https://tokenized.sandbox.bka.sh/v1.2.0-beta`
> Live base URL: `https://tokenized.pay.bka.sh/v1.2.0-beta`

You must also whitelist your **callback URL** (e.g. `https://yourdomain.com/api/payments/bkash/callback`) with bKash support.

---

## 2. Choose the right product

bKash offers 3 main products. For a website checkout, use **Tokenized Checkout (PGW)**:

- **Tokenized Checkout (recommended)** — modern, redirects customer to bKash hosted page, returns a `paymentID` + `trxID`. Best for one-time payments on websites.
- **Checkout (Legacy)** — older JS popup flow (`bKash.init`).
- **Checkout URL** — a static link, less flexible.

This guide uses **Tokenized Checkout**.

---

## 3. Payment flow (high level)

```
Customer → Checkout page → "Pay with bKash"
   → POST /api/payments/bkash/create  (your server)
        → Grant Token  (bKash)
        → Create Payment (bKash) → returns bkashURL + paymentID
   ← bkashURL
Customer redirected to bKash hosted page → enters bKash number + OTP + PIN
   → bKash redirects to your callbackURL with paymentID + status
        → POST /api/payments/bkash/execute  (your server)
            → Execute Payment (bKash) → returns trxID + transactionStatus = "Completed"
            → Save trxID, mark order paid in DB
   → Redirect customer to /order-success
```

---

## 4. Database changes

Add payment columns to the `orders` table (in [Admin/lib/db.ts](Admin/lib/db.ts) / migration):

```sql
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
-- pending | paid | failed | cancelled | refunded
ALTER TABLE orders ADD COLUMN bkash_payment_id TEXT;
ALTER TABLE orders ADD COLUMN bkash_trx_id TEXT;
ALTER TABLE orders ADD COLUMN bkash_payer_msisdn TEXT;
ALTER TABLE orders ADD COLUMN paid_at DATETIME;
```

`payment_method` already exists — values will be `cash_on_delivery` or `bkash`.

---

## 5. Environment variables

Create `Arong/.env.local`:

```env
# bKash Tokenized Checkout
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password
BKASH_CALLBACK_URL=http://localhost:3000/api/payments/bkash/callback

# When going live, swap to:
# BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
# BKASH_CALLBACK_URL=https://yourdomain.com/api/payments/bkash/callback
```

> Never commit `.env.local`. Add it to `.gitignore`.

---

## 6. bKash helper module

Create `Arong/lib/bkash.ts`:

```ts
const BASE = process.env.BKASH_BASE_URL!;

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getBkashToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${BASE}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: process.env.BKASH_USERNAME!,
      password: process.env.BKASH_PASSWORD!,
    },
    body: JSON.stringify({
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET,
    }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (!data.id_token) throw new Error('bKash token grant failed: ' + JSON.stringify(data));

  cachedToken = {
    token: data.id_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000,
  };
  return cachedToken.token;
}

export async function bkashCreatePayment(params: {
  amount: number;
  invoice: string;
  callbackURL: string;
}) {
  const token = await getBkashToken();

  const res = await fetch(`${BASE}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({
      mode: '0011',                       // 0011 = checkout (one-time)
      payerReference: params.invoice,     // shown to customer
      callbackURL: params.callbackURL,
      amount: params.amount.toFixed(2),   // string, 2 decimals
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: params.invoice,
    }),
    cache: 'no-store',
  });
  return res.json();
}

export async function bkashExecutePayment(paymentID: string) {
  const token = await getBkashToken();
  const res = await fetch(`${BASE}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID }),
    cache: 'no-store',
  });
  return res.json();
}

export async function bkashQueryPayment(paymentID: string) {
  const token = await getBkashToken();
  const res = await fetch(`${BASE}/tokenized/checkout/payment/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID }),
    cache: 'no-store',
  });
  return res.json();
}
```

---

## 7. API routes

### 7.1 Create payment — `Arong/app/api/payments/bkash/create/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { bkashCreatePayment } from '@/lib/bkash';

export async function POST(req: NextRequest) {
  const { order_number } = await req.json();

  const order = db
    .prepare('SELECT id, order_number, total, payment_status FROM orders WHERE order_number = ?')
    .get(order_number) as { id: number; order_number: string; total: number; payment_status: string } | undefined;

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.payment_status === 'paid')
    return NextResponse.json({ error: 'Already paid' }, { status: 400 });

  const result = await bkashCreatePayment({
    amount: order.total,
    invoice: order.order_number,
    callbackURL: process.env.BKASH_CALLBACK_URL!,
  });

  if (!result.bkashURL) {
    return NextResponse.json({ error: 'bKash create failed', detail: result }, { status: 502 });
  }

  db.prepare('UPDATE orders SET bkash_payment_id = ? WHERE id = ?')
    .run(result.paymentID, order.id);

  return NextResponse.json({ bkashURL: result.bkashURL, paymentID: result.paymentID });
}
```

### 7.2 Callback — `Arong/app/api/payments/bkash/callback/route.ts`

bKash will redirect (GET) the customer here with query params `paymentID`, `status`.

```ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { bkashExecutePayment, bkashQueryPayment } from '@/lib/bkash';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentID = searchParams.get('paymentID');
  const status = searchParams.get('status'); // success | failure | cancel
  const origin = new URL(req.url).origin;

  if (!paymentID) return NextResponse.redirect(`${origin}/checkout?bkash=invalid`);

  const order = db
    .prepare('SELECT id, order_number FROM orders WHERE bkash_payment_id = ?')
    .get(paymentID) as { id: number; order_number: string } | undefined;

  if (!order) return NextResponse.redirect(`${origin}/checkout?bkash=notfound`);

  if (status !== 'success') {
    db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?')
      .run(status === 'cancel' ? 'cancelled' : 'failed', order.id);
    return NextResponse.redirect(`${origin}/checkout?bkash=${status}`);
  }

  // Execute the payment to actually capture funds
  let result = await bkashExecutePayment(paymentID);

  // bKash recommends a fallback to query if execute times out
  if (!result || result.statusCode !== '0000') {
    result = await bkashQueryPayment(paymentID);
  }

  const ok = result?.transactionStatus === 'Completed' && result?.statusCode === '0000';

  if (!ok) {
    db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run('failed', order.id);
    return NextResponse.redirect(`${origin}/checkout?bkash=failed`);
  }

  db.prepare(`
    UPDATE orders
       SET payment_status = 'paid',
           bkash_trx_id = ?,
           bkash_payer_msisdn = ?,
           paid_at = datetime('now')
     WHERE id = ?
  `).run(result.trxID, result.customerMsisdn || null, order.id);

  return NextResponse.redirect(`${origin}/order-success?order=${order.order_number}`);
}
```

---

## 8. Wiring into the checkout page

In [Arong/app/checkout/page.tsx](Arong/app/checkout/page.tsx):

1. Add a payment method radio group (`Cash on Delivery` / `bKash`).
2. On submit:
   - Always create the order first via `POST /api/orders` with `payment_method`.
   - If `bkash`: call `POST /api/payments/bkash/create` with the returned `order_number`, then `window.location.href = bkashURL`.
   - If `cash_on_delivery`: redirect to `/order-success` as today.

```tsx
// after order creation succeeds
if (form.payment_method === 'bkash') {
  const r = await fetch('/api/payments/bkash/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_number: data.order_number }),
  });
  const j = await r.json();
  if (j.bkashURL) {
    clearCart();
    window.location.href = j.bkashURL;
    return;
  }
  setErrors({ submit: 'Failed to start bKash payment' });
  return;
}
```

> Important: only `clearCart()` after the bKash redirect URL is obtained, or after COD success. If bKash payment fails, the customer returns to `/checkout?bkash=failed` and can retry from the order.

---

## 9. Admin panel updates

In [Admin/app/(admin)/orders/[id]/page.tsx](Admin/app/(admin)/orders/[id]/page.tsx) and the orders list, surface:

- `payment_method` (COD vs bKash)
- `payment_status` badge (pending / paid / failed)
- `bkash_trx_id` — link/copy for reconciliation
- `paid_at` timestamp

Add a manual **"Mark as paid"** action (admin-only) for edge cases.

---

## 10. Security checklist (OWASP-aligned)

- [ ] All bKash secrets only in `.env.local`, never in client code.
- [ ] Validate amount **server-side** from DB, never trust the client.
- [ ] Never mark order paid based on the redirect query alone — always call `execute` (and `query` as fallback) from the server.
- [ ] Use idempotency: if `payment_status = 'paid'` already, ignore duplicate callbacks.
- [ ] Force HTTPS in production; bKash will not whitelist `http://` callbacks except `localhost`.
- [ ] Log every bKash response (without secrets) into an `audit_log` for disputes.
- [ ] Rate-limit `/api/payments/bkash/create` to prevent abuse.
- [ ] Sanitize `order_number` (already generated server-side in [Arong/app/api/orders/route.ts](Arong/app/api/orders/route.ts) — keep it that way).

---

## 11. Sandbox testing

bKash provides test wallets, e.g.:

| MSISDN | OTP | PIN |
|---|---|---|
| 01770618567 | 123456 | 12121 |
| 01619777282 | 123456 | 12121 |

(Use the exact ones bKash sends in your sandbox welcome email — they rotate.)

Test cases to cover:

1. Successful payment → order shows `paid`, trxID stored.
2. User cancels on bKash page → order `cancelled`, customer back on `/checkout?bkash=cancel`.
3. Wrong PIN / failure → order `failed`.
4. Network drop after `create` but before `execute` → callback eventually fires, query fallback succeeds.
5. Duplicate callback hit → no double-update (idempotency).
6. Amount tampering attempt from client → server uses DB total, not client value.

---

## 12. Going live

1. Switch `BKASH_BASE_URL` to live, replace credentials with live App Key/Secret/Username/Password.
2. Update `BKASH_CALLBACK_URL` to your HTTPS production URL.
3. Email bKash integration support to whitelist the live callback domain.
4. Run a small live transaction (e.g. BDT 1) end-to-end and verify:
   - Funds appear in merchant wallet.
   - `bkash_trx_id` matches the wallet statement.
5. Enable monitoring/alerts on `/api/payments/bkash/*` error rates.

---

## 13. File map (new files to add)

```
Arong/
  .env.local                                       # secrets
  lib/bkash.ts                                     # API helper
  app/api/payments/bkash/create/route.ts           # start payment
  app/api/payments/bkash/callback/route.ts         # execute + redirect
```

Modified files:

```
Arong/app/checkout/page.tsx                        # payment method UI + redirect
Arong/app/api/orders/route.ts                      # accept payment_method = 'bkash', save payment_status='pending'
Admin/lib/db.ts                                    # migration: add payment columns
Admin/app/(admin)/orders/...                       # show payment status / trxID
```

---

## 14. References

- bKash PGW Tokenized Checkout API docs (provided by bKash on merchant onboarding).
- Postman collection: request from `integration@bkash.com`.
- Status codes: `0000` = success; non-zero = failure (see bKash error code list).
