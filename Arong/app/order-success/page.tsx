'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-3">Order Placed Successfully!</h1>
      <p className="text-gray-600 mb-2">
        Thank you for your order. We&apos;ll process it right away.
      </p>
      {orderNumber && (
        <div className="bg-gray-50 border rounded-sm p-4 my-6">
          <p className="text-sm text-gray-500 mb-1">Your Order ID</p>
          <p className="font-bold text-xl">{orderNumber}</p>
          <p className="text-xs text-gray-400 mt-1">Save this to track your order</p>
        </div>
      )}
      <p className="text-sm text-gray-500 mb-8">
        Cash on Delivery — Our team will contact you to confirm your order.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderNumber && (
          <Link
            href={`/track-order?id=${orderNumber}`}
            className="border border-black px-8 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Track Order
          </Link>
        )}
        <Link
          href="/products"
          className="bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <OrderSuccessContent />
    </Suspense>
  );
}
