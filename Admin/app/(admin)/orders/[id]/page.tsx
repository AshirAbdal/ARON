'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

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
  email?: string;
  address: string;
  city: string;
  division: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string;
  notes?: string;
  coupon_code?: string;
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

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.order);
        setItems(d.items || []);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    await fetch(`/api/orders/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setOrder((prev) => (prev ? { ...prev, status } : null));
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Order not found.</p>
        <Link href="/orders" className="mt-2 inline-block underline text-sm">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="font-mono text-sm text-gray-500 mt-1">{order.order_number}</p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
              STATUS_COLORS[order.status] || 'bg-gray-100'
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-0.5">Name</p>
              <p className="font-medium">{order.full_name}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Phone</p>
              <p className="font-medium">{order.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-0.5">Email</p>
              <p className="font-medium">
                {order.email ? (
                  <a href={`mailto:${order.email}`} className="hover:underline">{order.email}</a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-0.5">Address</p>
              <p className="font-medium">{order.address}</p>
              <p className="text-gray-600">{order.city}, {order.division}</p>
            </div>
            {order.notes && (
              <div className="col-span-2">
                <p className="text-gray-500 mb-0.5">Order Note</p>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 mb-0.5">Payment</p>
              <p className="font-medium capitalize">{order.payment_method.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Placed On</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString('en-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Order Items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-600">Product</th>
                <th className="text-center py-2 font-medium text-gray-600">Qty</th>
                <th className="text-right py-2 font-medium text-gray-600">Price</th>
                <th className="text-right py-2 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3">
                    <p>{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-gray-400">{item.variant_name}</p>
                    )}
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">৳{item.price.toLocaleString()}</td>
                  <td className="py-3 text-right font-medium">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t mt-2 pt-3 space-y-1.5 text-sm">
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
                <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                <span>-৳{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total</span>
              <span>৳{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Update Status */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating || order.status === s}
                className={`px-4 py-2 text-sm rounded transition-colors capitalize ${
                  order.status === s
                    ? 'bg-black text-white cursor-default'
                    : 'border border-gray-300 hover:border-black disabled:opacity-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
