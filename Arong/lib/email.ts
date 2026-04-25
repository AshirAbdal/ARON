import nodemailer from 'nodemailer';

export type OrderEmailItem = {
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  price: number;
};

export type OrderEmailPayload = {
  to: string;
  order_number: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  division: string;
  notes?: string | null;
  payment_method: string;
  items: OrderEmailItem[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  coupon_code?: string | null;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[email] SMTP env vars not configured; emails will be skipped.');
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
  });

  return cachedTransporter;
}

function formatBDT(n: number): string {
  return `৳${Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

function escapeHtml(input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInvoiceHtml(order: OrderEmailPayload): string {
  const brand = process.env.BRAND_NAME || 'Arong';
  const itemRows = order.items
    .map((it) => {
      const name = escapeHtml(it.product_name) + (it.variant_name ? ` <span style="color:#888;">(${escapeHtml(it.variant_name)})</span>` : '');
      const lineTotal = it.price * it.quantity;
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">${name}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatBDT(it.price)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatBDT(lineTotal)}</td>
        </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #eee;">
            <tr>
              <td style="background:#000;color:#fff;padding:24px;text-align:center;">
                <h1 style="margin:0;font-size:22px;letter-spacing:2px;">${escapeHtml(brand)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h2 style="margin:0 0 8px;font-size:20px;">Thank you for your order, ${escapeHtml(order.full_name)}!</h2>
                <p style="margin:0 0 16px;color:#555;line-height:1.5;">
                  We've received your order and will process it shortly. Below is your order summary and invoice for your records.
                </p>

                <div style="background:#fafafa;border:1px solid #eee;padding:16px;margin:16px 0;">
                  <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${escapeHtml(order.order_number)}</p>
                  <p style="margin:0 0 6px;"><strong>Payment Method:</strong> ${escapeHtml(order.payment_method.replace(/_/g, ' '))}</p>
                  ${order.coupon_code ? `<p style="margin:0;"><strong>Coupon:</strong> ${escapeHtml(order.coupon_code)}</p>` : ''}
                </div>

                <h3 style="margin:24px 0 8px;font-size:16px;">Shipping Details</h3>
                <p style="margin:0;line-height:1.6;color:#444;">
                  ${escapeHtml(order.full_name)}<br/>
                  ${escapeHtml(order.address)}<br/>
                  ${escapeHtml(order.city)}, ${escapeHtml(order.division)}<br/>
                  Phone: ${escapeHtml(order.phone)}
                </p>
                ${order.notes ? `<p style="margin:8px 0 0;color:#555;"><em>Note:</em> ${escapeHtml(order.notes)}</p>` : ''}

                <h3 style="margin:24px 0 8px;font-size:16px;">Order Items</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
                  <thead>
                    <tr style="background:#f0f0f0;">
                      <th align="left" style="padding:10px;border-bottom:1px solid #ddd;">Product</th>
                      <th style="padding:10px;border-bottom:1px solid #ddd;">Qty</th>
                      <th align="right" style="padding:10px;border-bottom:1px solid #ddd;">Price</th>
                      <th align="right" style="padding:10px;border-bottom:1px solid #ddd;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemRows}
                  </tbody>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:14px;">
                  <tr>
                    <td align="right" style="padding:4px 10px;color:#555;">Subtotal:</td>
                    <td align="right" style="padding:4px 0;width:140px;">${formatBDT(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td align="right" style="padding:4px 10px;color:#555;">Shipping:</td>
                    <td align="right" style="padding:4px 0;">${order.shipping_cost === 0 ? 'Free' : formatBDT(order.shipping_cost)}</td>
                  </tr>
                  ${order.discount > 0 ? `
                  <tr>
                    <td align="right" style="padding:4px 10px;color:#555;">Discount:</td>
                    <td align="right" style="padding:4px 0;color:#16a34a;">-${formatBDT(order.discount)}</td>
                  </tr>` : ''}
                  <tr>
                    <td align="right" style="padding:10px;border-top:2px solid #000;font-weight:bold;font-size:16px;">Total:</td>
                    <td align="right" style="padding:10px 0;border-top:2px solid #000;font-weight:bold;font-size:16px;">${formatBDT(order.total)}</td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;color:#555;line-height:1.5;">
                  You can track your order any time using your order number on our website.
                </p>
                <p style="margin:16px 0 0;color:#555;">Thanks for shopping with ${escapeHtml(brand)}!</p>
              </td>
            </tr>
            <tr>
              <td style="background:#fafafa;color:#888;padding:16px;text-align:center;font-size:12px;">
                This is an automated email. Please do not reply directly.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderInvoiceText(order: OrderEmailPayload): string {
  const lines: string[] = [];
  lines.push(`Thank you for your order, ${order.full_name}!`);
  lines.push('');
  lines.push(`Order Number: ${order.order_number}`);
  lines.push(`Payment Method: ${order.payment_method.replace(/_/g, ' ')}`);
  if (order.coupon_code) lines.push(`Coupon: ${order.coupon_code}`);
  lines.push('');
  lines.push('Shipping Details:');
  lines.push(`${order.full_name}`);
  lines.push(`${order.address}`);
  lines.push(`${order.city}, ${order.division}`);
  lines.push(`Phone: ${order.phone}`);
  if (order.notes) lines.push(`Note: ${order.notes}`);
  lines.push('');
  lines.push('Items:');
  for (const it of order.items) {
    const name = it.variant_name ? `${it.product_name} (${it.variant_name})` : it.product_name;
    lines.push(`- ${name} x ${it.quantity} @ ৳${it.price} = ৳${it.price * it.quantity}`);
  }
  lines.push('');
  lines.push(`Subtotal: ৳${order.subtotal}`);
  lines.push(`Shipping: ${order.shipping_cost === 0 ? 'Free' : `৳${order.shipping_cost}`}`);
  if (order.discount > 0) lines.push(`Discount: -৳${order.discount}`);
  lines.push(`Total: ৳${order.total}`);
  lines.push('');
  lines.push(`Thanks for shopping with ${process.env.BRAND_NAME || 'Arong'}!`);
  return lines.join('\n');
}

export async function sendOrderConfirmationEmail(order: OrderEmailPayload): Promise<void> {
  if (!order.to) return;

  const transporter = getTransporter();
  if (!transporter) return;

  const fromName = process.env.SMTP_FROM_NAME || process.env.BRAND_NAME || 'Arong';
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER!;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: order.to,
    subject: `Thank you for your order — Invoice #${order.order_number}`,
    text: renderInvoiceText(order),
    html: renderInvoiceHtml(order),
  });
}

function renderAdminHtml(order: OrderEmailPayload): string {
  const itemRows = order.items
    .map((it) => {
      const name = escapeHtml(it.product_name) + (it.variant_name ? ` <span style="color:#888;">(${escapeHtml(it.variant_name)})</span>` : '');
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatBDT(it.price)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatBDT(it.price * it.quantity)}</td>
        </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr><td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #ddd;">
          <tr>
            <td style="background:#16a34a;color:#fff;padding:18px 24px;">
              <h2 style="margin:0;font-size:18px;">🛒 New Order Received — #${escapeHtml(order.order_number)}</h2>
            </td>
          </tr>
          <tr><td style="padding:24px;">
            <p style="margin:0 0 12px;"><strong>Total:</strong> <span style="font-size:18px;color:#16a34a;">${formatBDT(order.total)}</span></p>

            <h3 style="margin:18px 0 6px;font-size:15px;">Customer</h3>
            <table cellpadding="4" cellspacing="0" style="font-size:14px;">
              <tr><td><strong>Name:</strong></td><td>${escapeHtml(order.full_name)}</td></tr>
              <tr><td><strong>Phone:</strong></td><td><a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a> &nbsp;|&nbsp; <a href="https://wa.me/${escapeHtml(order.phone.replace(/[^0-9]/g, ''))}">WhatsApp</a></td></tr>
              <tr><td><strong>Email:</strong></td><td>${escapeHtml(order.to)}</td></tr>
              <tr><td valign="top"><strong>Address:</strong></td><td>${escapeHtml(order.address)}<br/>${escapeHtml(order.city)}, ${escapeHtml(order.division)}</td></tr>
              <tr><td><strong>Payment:</strong></td><td>${escapeHtml(order.payment_method.replace(/_/g, ' '))}</td></tr>
              ${order.coupon_code ? `<tr><td><strong>Coupon:</strong></td><td>${escapeHtml(order.coupon_code)}</td></tr>` : ''}
              ${order.notes ? `<tr><td valign="top"><strong>Note:</strong></td><td>${escapeHtml(order.notes)}</td></tr>` : ''}
            </table>

            <h3 style="margin:20px 0 6px;font-size:15px;">Items</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;border:1px solid #eee;">
              <thead>
                <tr style="background:#f0f0f0;">
                  <th align="left" style="padding:8px;">Product</th>
                  <th style="padding:8px;">Qty</th>
                  <th align="right" style="padding:8px;">Price</th>
                  <th align="right" style="padding:8px;">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;font-size:14px;">
              <tr><td align="right" style="padding:3px 10px;color:#555;">Subtotal:</td><td align="right" style="width:140px;">${formatBDT(order.subtotal)}</td></tr>
              <tr><td align="right" style="padding:3px 10px;color:#555;">Shipping:</td><td align="right">${order.shipping_cost === 0 ? 'Free' : formatBDT(order.shipping_cost)}</td></tr>
              ${order.discount > 0 ? `<tr><td align="right" style="padding:3px 10px;color:#555;">Discount:</td><td align="right" style="color:#16a34a;">-${formatBDT(order.discount)}</td></tr>` : ''}
              <tr><td align="right" style="padding:8px 10px;border-top:2px solid #000;font-weight:bold;">Total:</td><td align="right" style="border-top:2px solid #000;font-weight:bold;">${formatBDT(order.total)}</td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendAdminOrderNotification(order: OrderEmailPayload): Promise<void> {
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminTo) return;

  const transporter = getTransporter();
  if (!transporter) return;

  const fromName = process.env.SMTP_FROM_NAME || process.env.BRAND_NAME || 'Arong';
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER!;

  await transporter.sendMail({
    from: `"${fromName} Orders" <${fromAddress}>`,
    to: adminTo,
    subject: `🛒 New Order #${order.order_number} — ${formatBDT(order.total)} — ${order.full_name}`,
    text: `New order received!\n\n${renderInvoiceText(order)}`,
    html: renderAdminHtml(order),
  });
}
