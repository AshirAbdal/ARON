import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions — ARON Cosmetics & Fashion',
  description: 'Read the Terms and Conditions of ARON Cosmetics & Fashion for purchasing, delivery, returns, and use of our website.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-base text-gray-500">Last updated: April 2026</p>
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

        {/* Intro */}
        <section>
          <p>
            Welcome to ARON Cosmetics &amp; Fashion (&quot;ARON&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By accessing our website or placing an order, you agree to be bound by these Terms &amp; Conditions. Please read them carefully before using our services.
          </p>
          <p className="mt-3">
            If you do not agree with any part of these terms, please do not use our website or services.
          </p>
        </section>

        <Divider />

        {/* 1 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. About ARON</h2>
          <p>
            ARON Cosmetics &amp; Fashion is an online retail business registered and operating in Bangladesh. We sell cosmetics, skincare, makeup, fragrances, and fashion accessories through our website and deliver across Bangladesh.
          </p>
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4 text-base space-y-1">
            <p><strong>Business Location:</strong> Sherpur, Bangladesh</p>
            <p><strong>Email:</strong> <a href="mailto:arongbd@gmail.com" className="underline text-black">arongbd@gmail.com</a></p>
            <p><strong>Phone / WhatsApp:</strong> <a href="tel:+8801700000000" className="underline text-black">+880 1700-000000</a></p>
          </div>
        </section>

        <Divider />

        {/* 2 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Use of Our Website</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must be at least 13 years old to use our website.</li>
            <li>You agree not to misuse our website for any unlawful, fraudulent, or harmful purpose.</li>
            <li>You must provide accurate and complete information when placing an order.</li>
            <li>You are responsible for keeping your contact details up to date so that we can reach you regarding your order.</li>
            <li>We reserve the right to refuse service or cancel orders at our sole discretion.</li>
          </ul>
        </section>

        <Divider />

        {/* 3 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Products &amp; Pricing</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>All product prices are listed in Bangladeshi Taka (৳) and include applicable taxes unless stated otherwise.</li>
            <li>Prices may change without prior notice. The price at the time of order confirmation is the final price.</li>
            <li>Product images are for illustrative purposes. Slight variations in colour or packaging may occur.</li>
            <li>We reserve the right to correct any pricing errors or inaccuracies at any time, even after an order is placed.</li>
            <li>All products sold by ARON are 100% original and sourced from authorised distributors. We do not sell fake, duplicate, or near-expiry items.</li>
          </ul>
        </section>

        <Divider />

        {/* 4 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Placing an Order</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Orders can be placed 24 hours a day through our website.</li>
            <li>Once you submit an order, you will receive an order number (starting with ARG-). Please save this number for tracking and reference.</li>
            <li>Order confirmation is subject to product availability. If a product is out of stock after your order, we will contact you to offer an alternative or a full refund.</li>
            <li>We reserve the right to cancel any order at our discretion with a full refund where applicable.</li>
          </ul>
        </section>

        <Divider />

        {/* 5 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Payment</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We currently accept <strong>Cash on Delivery (COD)</strong> only. Payment is made in cash to our delivery agent upon receipt of your order.</li>
            <li>Please have the exact amount ready at the time of delivery.</li>
            <li>Refusing to pay for a confirmed order without valid reason may result in your future orders being declined.</li>
            <li>We do not store any financial information such as bKash PINs or card numbers.</li>
          </ul>
        </section>

        <Divider />

        {/* 6 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Delivery</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We deliver across all 8 divisions of Bangladesh.</li>
            <li>Delivery to <strong>Sherpur is free</strong>. Delivery to all other areas costs <strong>৳120</strong>.</li>
            <li>Estimated delivery times: Sherpur — 1–2 business days; outside Sherpur — 3–5 business days.</li>
            <li>Delivery times are estimates and may be affected by public holidays, Eid, natural disasters, or courier delays beyond our control.</li>
            <li>ARON is not responsible for delays caused by incorrect or incomplete delivery addresses provided by the customer.</li>
            <li>If you are unavailable at the time of delivery, our delivery agent may attempt redelivery or contact you to reschedule. After 2 failed attempts, the order may be returned to us.</li>
          </ul>
        </section>

        <Divider />

        {/* 7 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cancellations</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You may cancel your order within <strong>2 hours</strong> of placing it by contacting us via WhatsApp or phone.</li>
            <li>Once an order is dispatched, it cannot be cancelled.</li>
            <li>ARON reserves the right to cancel any order due to stock unavailability, incorrect pricing, or suspected fraudulent activity. You will be notified and, if applicable, refunded.</li>
          </ul>
        </section>

        <Divider />

        {/* 8 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Returns &amp; Refunds</h2>
          <p>In accordance with the <em>Consumer Rights Protection Act 2009 (Bangladesh)</em>, we accept returns under the following conditions:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>Return requests must be made within <strong>3 days</strong> of receiving your order.</li>
            <li>Eligible return reasons: damaged product, defective product, wrong item delivered, or expired product.</li>
            <li>The product must be unused, in original packaging, with seals intact.</li>
            <li>We do <strong>not</strong> accept returns for change of mind, opened/used products, or items purchased during final sale.</li>
            <li>To initiate a return, contact us via WhatsApp with your order number and clear photos of the issue.</li>
            <li>Once the returned product is received and inspected, refunds are processed within <strong>5–7 business days</strong> via bKash or Nagad to your registered mobile number.</li>
          </ul>
        </section>

        <Divider />

        {/* 9 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Coupon Codes &amp; Promotions</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Coupon codes are subject to minimum order requirements and expiry dates as specified.</li>
            <li>Only one coupon code may be applied per order.</li>
            <li>Coupons cannot be combined with other offers unless explicitly stated.</li>
            <li>ARON reserves the right to withdraw, modify, or expire any promotional offer at any time without prior notice.</li>
            <li>Misuse or fraudulent use of coupon codes will result in order cancellation.</li>
          </ul>
        </section>

        <Divider />

        {/* 10 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Intellectual Property</h2>
          <p>
            All content on this website — including the ARON brand name, logo, product images, descriptions, and design — is the intellectual property of ARON Cosmetics &amp; Fashion and is protected under applicable Bangladeshi and international intellectual property laws.
          </p>
          <p className="mt-3">
            You may not reproduce, distribute, modify, or use our content for commercial purposes without our prior written permission.
          </p>
        </section>

        <Divider />

        {/* 11 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, ARON shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or products, including but not limited to skin reactions to cosmetic products (which vary by individual). We recommend reading all product ingredient lists and consulting a dermatologist if you have known allergies.
          </p>
        </section>

        <Divider />

        {/* 12 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Privacy</h2>
          <p>
            Your use of our website is also governed by our{' '}
            <Link href="/privacy-policy" className="underline text-black hover:opacity-70">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms &amp; Conditions by reference.
          </p>
        </section>

        <Divider />

        {/* 13 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">13. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms &amp; Conditions are governed by the laws of the People&apos;s Republic of Bangladesh. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Bangladesh.
          </p>
          <p className="mt-3">
            Relevant laws include but are not limited to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Consumer Rights Protection Act 2009</li>
            <li>Digital Security Act 2018</li>
            <li>ICT Act 2006 (amended 2013)</li>
            <li>Contract Act 1872</li>
            <li>National Digital Commerce Policy 2018</li>
          </ul>
        </section>

        <Divider />

        {/* 14 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">14. Changes to These Terms</h2>
          <p>
            We reserve the right to update or modify these Terms &amp; Conditions at any time. Changes will be posted on this page with an updated date. Continued use of our website after changes are posted constitutes your acceptance of the revised terms.
          </p>
        </section>

        <Divider />

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Us</h2>
          <p>For any questions about these Terms &amp; Conditions, please contact us:</p>
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-1.5 text-base">
            <p><strong>ARON Cosmetics &amp; Fashion</strong></p>
            <p>Sherpur, Bangladesh</p>
            <p>Email: <a href="mailto:arongbd@gmail.com" className="underline text-black">arongbd@gmail.com</a></p>
            <p>WhatsApp / Phone: <a href="tel:+8801700000000" className="underline text-black">+880 1700-000000</a></p>
            <p>Support hours: Saturday–Thursday, 10:00 AM – 8:00 PM</p>
          </div>
        </section>

      </div>
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-200" />;
}
