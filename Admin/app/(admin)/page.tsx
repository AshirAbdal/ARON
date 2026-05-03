'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, DollarSign, Clock } from 'lucide-react';

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
  recentOrders: Order[];
}

interface Order {
  id: number;
  order_number: string;
  full_name: string;
  phone: string;
  total: number;
  status: string;
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch dashboard')))
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Products',
      value: data?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      link: '/products',
    },
    {
      label: 'Total Orders',
      value: data?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-green-50 text-green-600',
      link: '/orders',
    },
    {
      label: 'Pending Orders',
      value: data?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
      link: '/orders?status=pending',
    },
    {
      label: 'Total Revenue',
      value: `৳${(data?.revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-600',
      link: '/orders',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome to ARON Admin Panel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.link}
            className="bg-white rounded-lg p-5 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link
            href="/orders"
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Order ID</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No orders yet
                  </td>
                </tr>
              )}
              {data?.recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs">{order.order_number}</td>
                  <td className="px-5 py-3">
                    <p>{order.full_name}</p>
                    <p className="text-xs text-gray-400">{order.phone}</p>
                  </td>
                  <td className="px-5 py-3 font-medium">৳{order.total.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                        STATUS_COLORS[order.status] || 'bg-gray-100'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-BD')}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
