'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Order {
  id: number;
  order_number: string;
  full_name: string;
  phone: string;
  city: string;
  division: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface SuspiciousOrder {
  id: number;
  order_id: number | null;
  order_number: string;
  full_name: string;
  phone: string;
  email: string | null;
  ip: string | null;
  score: number;
  reasons_json: string;
  review_status: 'pending' | 'approved' | 'blocked';
  created_at: string;
  total: number | null;
  order_status: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUSES = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [suspiciousOrders, setSuspiciousOrders] = useState<SuspiciousOrder[]>([]);
  const [suspiciousLoading, setSuspiciousLoading] = useState(true);

  const fetchSuspiciousOrders = async () => {
    setSuspiciousLoading(true);
    try {
      const res = await fetch('/api/orders/suspicious?review_status=pending&limit=100');
      if (!res.ok) { setSuspiciousLoading(false); return; }
      const data = await res.json();
      setSuspiciousOrders(data.suspiciousOrders || []);
    } catch (err) {
      console.error('[orders] Failed to fetch suspicious orders:', err);
    } finally {
      setSuspiciousLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('[orders] Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSuspiciousOrders();
  }, [statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  const updateReviewStatus = async (id: number, review_status: 'pending' | 'approved' | 'blocked') => {
    await fetch('/api/orders/suspicious', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, review_status }),
    });
    fetchSuspiciousOrders();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{total} orders total</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                statusFilter === s
                  ? 'bg-black text-white'
                  : 'border border-gray-300 hover:border-black'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-5">
        <div className="px-5 py-3 border-b bg-red-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-red-800">Suspicious Orders Review</h2>
            <p className="text-xs text-red-600">Orders flagged by fraud rules</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
            {suspiciousOrders.length} pending
          </span>
        </div>

        {suspiciousLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : suspiciousOrders.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">No suspicious orders pending review.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Order</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Score</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Reasons</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Review</th>
                </tr>
              </thead>
              <tbody>
                {suspiciousOrders.map((s) => {
                  let reasons: string[] = [];
                  try {
                    reasons = JSON.parse(s.reasons_json || '[]') as string[];
                  } catch {
                    reasons = [];
                  }

                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs">{s.order_number}</p>
                        {s.order_id && (
                          <Link href={`/orders/${s.order_id}`} className="text-xs text-blue-600 hover:underline">
                            View details
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium">{s.full_name}</p>
                        <p className="text-xs text-gray-500">{s.phone}</p>
                        {s.email && <p className="text-xs text-gray-500">{s.email}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">{s.score}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {reasons.map((r) => (
                            <span key={r} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(s.created_at).toLocaleString('en-BD')}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateReviewStatus(s.id, 'approved')}
                            className="text-xs px-2 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateReviewStatus(s.id, 'blocked')}
                            className="text-xs px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Block
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No orders found{statusFilter ? ` with status "${statusFilter}"` : ''}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Order</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Location</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{o.full_name}</p>
                    <p className="text-xs text-gray-400">{o.phone}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {o.city}, {o.division}
                  </td>
                  <td className="px-5 py-3 font-medium">৳{o.total.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <select
                      aria-label="Update order status"
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border-0 font-medium cursor-pointer focus:outline-none ${
                        STATUS_COLORS[o.status] || 'bg-gray-100'
                      }`}
                    >
                      {STATUSES.filter(Boolean).map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(o.created_at).toLocaleDateString('en-BD')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/orders/${o.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrdersContent />
    </Suspense>
  );
}
