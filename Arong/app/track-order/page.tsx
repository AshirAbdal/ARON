'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package } from 'lucide-react';

interface OrderItem {
  id: number;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  order_number: string;
  full_name: string;
  phone: string;
  city: string;
  division: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const autoLookupRef = useRef(false);

  const lookupOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id.trim())}`);
      if (!res.ok) {
        setOrder(null);
        setError('Order not found. Please check your order ID.');
        return;
      }
      const data = await res.json();
      setOrder(data.order);
      setItems(data.items || []);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-lookup if ?id= or ?order= is provided in the URL
  useEffect(() => {
    if (autoLookupRef.current) return;
    const fromUrl = searchParams.get('id') || searchParams.get('order') || '';
    if (fromUrl) {
      autoLookupRef.current = true;
      setOrderId(fromUrl);
      lookupOrder(fromUrl);
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await lookupOrder(orderId);
  };

  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStep = order ? statusSteps.indexOf(order.status) : -1;
  const progressWidths = ['w-0', 'w-1/4', 'w-2/4', 'w-3/4', 'w-full'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Track your order</h1>
        <p className="text-gray-500">
          Enter your order ID to track your order status and delivery details.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Order ID (e.g. ARG-123456-789)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="flex-1 border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-3 flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            Track
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Searching for your order...
        </div>
      )}

      {/* Error */}
      {!loading && searched && error && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="font-bold text-lg mb-1">Order not found!!</p>
          <p className="text-gray-500">Please enter your valid order id or contact us for help.</p>
        </div>
      )}

      {/* Order Details */}
      {!loading && order && (
        <div className="space-y-6">
          {/* Status card */}
          <div className="border rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Order</p>
                <p className="font-bold text-lg">{order.order_number}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              Placed on:{' '}
              <span className="text-black">
                {new Date(order.created_at).toLocaleDateString('en-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Delivery to:{' '}
              <span className="text-black">
                {order.city}, {order.division}
              </span>
            </p>
          </div>

          {/* Progress */}
          {order.status !== 'cancelled' && (
            <div className="border rounded-sm p-6">
              <h3 className="font-semibold mb-4">Order Progress</h3>
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200">
                  <div
                    className={`h-full bg-black transition-all ${progressWidths[Math.max(0, currentStep)] ?? 'w-0'}`}
                  />
                </div>
                {statusSteps.map((step, i) => (
                  <div key={step} className="relative flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${
                        i <= currentStep
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {i <= currentStep ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs">{i + 1}</span>
                      )}
                    </div>
                    <p className="text-xs mt-1 text-center capitalize w-16">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="border rounded-sm p-6">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-gray-500 text-xs">{item.variant_name}</p>
                    )}
                    <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">৳{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>৳{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>৳{order.shipping_cost.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-৳{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total</span>
                <span>৳{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
