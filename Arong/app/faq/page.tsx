'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    category: 'Orders & Payment',
    items: [
      {
        q: 'How can I place an order?',
        a: 'Simply browse our shop, add products to your cart, and proceed to checkout. Fill in your delivery details, apply any coupon code if you have one, and confirm your order. We accept Cash on Delivery (COD) across Bangladesh.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'Currently we accept Cash on Delivery (COD) for all orders across Bangladesh. You pay when your product arrives at your door — no advance payment required.',
      },
      {
        q: 'Can I cancel or change my order after placing it?',
        a: 'You can cancel or modify your order within 2 hours of placing it. Please contact us immediately via WhatsApp or call at +880 1700-000000. Once your order is shipped, it cannot be cancelled.',
      },
      {
        q: 'Is there a minimum order amount?',
        a: 'There is no minimum order amount. However, some coupon codes may have minimum purchase requirements (e.g., ARONG10 requires ৳500 minimum order).',
      },
    ],
  },
  {
    category: 'Delivery & Shipping',
    items: [
      {
        q: 'How much does delivery cost?',
        a: 'Delivery to Sherpur is FREE. Delivery to all other areas costs ৳120. Delivery charges are shown clearly at checkout before you confirm your order.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Sherpur: 1–2 business days. Other areas: 3–5 business days. Delivery times may vary during public holidays, Eid, or extreme weather conditions.',
      },
      {
        q: 'Do you deliver all over Bangladesh?',
        a: 'Yes! We deliver to all 8 divisions of Bangladesh — Dhaka, Chattogram, Sylhet, Rajshahi, Khulna, Barisal, Mymensingh, and Rangpur — including most districts and upazilas.',
      },
      {
        q: 'How can I track my order?',
        a: 'Visit our Track Order page and enter your order number (starts with ARG-). You can find your order number in the confirmation message sent after placing your order. We will also update your order status as it progresses.',
      },
    ],
  },
  {
    category: 'Products & Authenticity',
    items: [
      {
        q: 'Are your products 100% original?',
        a: 'Yes, absolutely. All products sold on ARON are 100% original and authentic. We source directly from authorized distributors and brand representatives. We do not sell any fake, duplicate, or refurbished products.',
      },
      {
        q: 'Are the products safe for sensitive skin?',
        a: 'We carry a wide range of products including those specifically formulated for sensitive skin. Each product page includes full ingredient details and skin type recommendations. If you are unsure, please consult with a dermatologist or contact us before purchasing.',
      },
      {
        q: 'Do you sell expired products?',
        a: 'Never. Every product is checked for expiry before dispatch. We do not stock or sell products near expiry. If you ever receive a product with an expired or damaged seal, contact us immediately for a replacement.',
      },
      {
        q: 'Do you have new arrivals regularly?',
        a: 'Yes! We regularly add new products. Visit our New Arrivals page or follow us on social media to stay updated on the latest additions to our collection.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 3 days of delivery if the product is damaged, defective, or you received the wrong item. The product must be unused, in its original packaging with seals intact. We do not accept returns for change of mind.',
      },
      {
        q: 'How do I return a product?',
        a: 'Contact us via WhatsApp at +880 1700-000000 with your order number and photos of the issue within 3 days of receiving your order. Our team will guide you through the return process.',
      },
      {
        q: 'When will I get my refund?',
        a: 'Once we receive and inspect the returned product, refunds are processed within 5–7 business days. As we currently operate on COD, refunds are typically made via bKash or Nagad to your registered mobile number.',
      },
    ],
  },
  {
    category: 'Coupons & Offers',
    items: [
      {
        q: 'How do I use a coupon code?',
        a: 'At checkout, you will see a "Coupon Code" field. Enter your code and click Apply. The discount will be applied automatically if your order meets the minimum requirement.',
      },
      {
        q: 'Can I use multiple coupon codes on one order?',
        a: 'No, only one coupon code can be applied per order. Choose the code that gives you the best discount.',
      },
      {
        q: 'Where can I find coupon codes?',
        a: 'Coupon codes are shared on our Facebook page, Instagram, and via WhatsApp to our regular customers. You can also subscribe to our newsletter to get exclusive offers.',
      },
    ],
  },
  {
    category: 'Customer Support',
    items: [
      {
        q: 'How can I contact ARON?',
        a: 'You can reach us via:\n• WhatsApp: +880 1700-000000\n• Email: arongbd@gmail.com\n• Phone: +880 1700-000000\nOur support team is available Saturday–Thursday, 10 AM – 8 PM.',
      },
      {
        q: 'What are your business hours?',
        a: 'We are available Saturday to Thursday, 10:00 AM to 8:00 PM. We are closed on Fridays and government holidays. You can still place orders 24/7 through our website.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-800 pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h1>
        <p className="text-gray-500 text-sm">
          Can&apos;t find your answer?{' '}
          <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="text-black font-medium underline underline-offset-2 hover:opacity-70">
            Contact us on WhatsApp
          </a>
        </p>
      </div>

      {/* FAQ sections */}
      <div className="space-y-10">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              {section.category}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-14 bg-black text-white rounded-xl p-8 text-center">
        <p className="text-lg font-semibold mb-2">Still have questions?</p>
        <p className="text-gray-400 text-sm mb-5">Our team is happy to help you.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://wa.me/8801700000000"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black text-sm font-medium px-6 py-2.5 rounded hover:bg-gray-100 transition-colors"
          >
            WhatsApp Us
          </a>
          <a
            href="mailto:arongbd@gmail.com"
            className="border border-white text-white text-sm font-medium px-6 py-2.5 rounded hover:bg-white hover:text-black transition-colors"
          >
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
