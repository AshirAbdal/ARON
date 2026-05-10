import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — ARON Cosmetics & Fashion',
  description: 'Read the Privacy Policy of ARON Cosmetics & Fashion. We are committed to protecting your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-base text-gray-500">Last updated: April 2026</p>
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

        {/* Intro */}
        <section>
          <p>
            ARON Cosmetics &amp; Fashion (&quot;ARON&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting the privacy and personal information of our customers. This Privacy Policy describes how we collect, use, store, and protect your information when you visit our website or place an order with us.
          </p>
          <p className="mt-3">
            By using our website, you agree to the terms of this Privacy Policy. If you do not agree, please do not use our website or services.
          </p>
        </section>

        <Divider />

        {/* 1 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
          <p>When you use our website or place an order, we may collect the following information:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li><strong>Personal Identification:</strong> Full name, phone number, and delivery address (including division and city).</li>
            <li><strong>Order Information:</strong> Products ordered, quantities, prices, coupon codes used, and payment method (Cash on Delivery).</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device type, and pages visited — collected automatically via standard web server logs.</li>
            <li><strong>Communication Data:</strong> Messages or queries sent to us via WhatsApp, email, or phone.</li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> collect credit/debit card numbers, bKash PINs, or any financial credentials. All Cash on Delivery transactions are handled in person by our delivery partners.
          </p>
        </section>

        <Divider />

        {/* 2 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>To process and deliver your orders.</li>
            <li>To confirm orders and send delivery status updates via phone or WhatsApp.</li>
            <li>To respond to your customer service inquiries.</li>
            <li>To improve our website, products, and services.</li>
            <li>To send promotional offers or new arrival updates — only if you have consented (e.g. subscribed to our WhatsApp or newsletter).</li>
            <li>To comply with applicable laws and regulations of Bangladesh.</li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> sell, rent, or trade your personal information to any third party for their marketing purposes.
          </p>
        </section>

        <Divider />

        {/* 3 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Sharing of Information</h2>
          <p>We may share your information only in the following limited circumstances:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li><strong>Delivery Partners:</strong> Your name, phone number, and delivery address will be shared with our courier/delivery partners solely for the purpose of delivering your order.</li>
            <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law, court order, or a lawful authority of the Government of Bangladesh, in accordance with the <em>Digital Security Act 2018</em> and other applicable legislation.</li>
            <li><strong>Business Operations:</strong> Trusted internal staff who need access to fulfil your order or provide customer service, subject to strict confidentiality obligations.</li>
          </ul>
        </section>

        <Divider />

        {/* 4 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Storage &amp; Security</h2>
          <p>
            Your personal data is stored securely on our servers. We implement appropriate technical and organisational measures to protect your information against unauthorised access, alteration, disclosure, or destruction.
          </p>
          <p className="mt-3">
            However, no method of transmission over the internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
          </p>
          <p className="mt-3">
            We retain your order data for a minimum of <strong>3 years</strong> to comply with applicable commercial and tax record-keeping obligations under Bangladeshi law.
          </p>
        </section>

        <Divider />

        {/* 5 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Cookies</h2>
          <p>
            Our website uses cookies to improve your browsing experience. Cookies are small text files stored on your device. We use cookies to:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li>Remember your shopping cart items.</li>
            <li>Understand how visitors use our website (analytics).</li>
          </ul>
          <p className="mt-3">
            You can disable cookies in your browser settings at any time. However, some features of the website (such as the shopping cart) may not function correctly without cookies.
          </p>
        </section>

        <Divider />

        {/* 6 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h2>
          <p>Under applicable Bangladeshi law and our own commitment to your privacy, you have the right to:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Ask us to correct any inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data, subject to our legal retention obligations.</li>
            <li><strong>Opt-out:</strong> Unsubscribe from any marketing communications at any time.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at <a href="mailto:arongbd@gmail.com" className="underline text-black hover:opacity-70">arongbd@gmail.com</a> or WhatsApp <a href="https://wa.me/8801700000000" className="underline text-black hover:opacity-70">+880 1700-000000</a>.
          </p>
        </section>

        <Divider />

        {/* 7 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Children&apos;s Privacy</h2>
          <p>
            Our website is not directed at children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us and we will delete it promptly.
          </p>
        </section>

        <Divider />

        {/* 8 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites (e.g. Facebook, Instagram). We are not responsible for the privacy practices of those websites. We encourage you to read their privacy policies before providing any personal information.
          </p>
        </section>

        <Divider />

        {/* 9 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date at the top. Continued use of our website after any changes constitutes your acceptance of the updated policy.
          </p>
        </section>

        <Divider />

        {/* 10 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Governing Law</h2>
          <p>
            This Privacy Policy is governed by and construed in accordance with the laws of the People&apos;s Republic of Bangladesh, including but not limited to the <em>Digital Security Act 2018</em>, <em>Information &amp; Communication Technology Act 2006 (amended 2013)</em>, and applicable consumer protection regulations.
          </p>
        </section>

        <Divider />

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-1.5 text-base">
            <p><strong>ARON Cosmetics &amp; Fashion</strong></p>
            <p>Sherpur, Bangladesh</p>
            <p>Email: <a href="mailto:arongbd@gmail.com" className="underline text-black">arongbd@gmail.com</a></p>
            <p>WhatsApp / Phone: <a href="tel:+8801700000000" className="underline text-black">+880 1700-000000</a></p>
          </div>
        </section>

      </div>
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-200" />;
}
