'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  brand?: string;
  price_min: number;
  price_max?: number;
  category_name?: string;
  audience?: string;
  stock: number;
  is_new_arrival: number;
  is_featured: number;
  primary_image?: string;
  created_at: string;
}

const AUDIENCE_LABEL: Record<string, string> = {
  men: 'Men',
  women: 'Women',
  baby: 'Baby',
  unisex: 'Unisex',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.set('search', search);
    if (audienceFilter) params.set('audience', audienceFilter);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, audienceFilter]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchProducts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{total} products total</p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors rounded"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 text-sm rounded focus:outline-none focus:border-black"
            />
          </div>
          <select
            aria-label="Filter by audience"
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
          >
            <option value="">All Audiences</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="baby">Baby</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No products found.</p>
            <Link href="/products/new" className="mt-2 inline-block text-sm underline text-black">
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Audience</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Price</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Flags</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={
                            p.primary_image
                              ? p.primary_image.startsWith('http')
                                ? p.primary_image
                                : `http://localhost:3000${p.primary_image}`
                              : '/placeholder.jpg'
                          }
                          alt={p.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">{p.name}</p>
                        {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.category_name || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {AUDIENCE_LABEL[p.audience || 'unisex'] || 'Unisex'}
                  </td>
                  <td className="px-5 py-3 font-medium">
                    {p.price_max && p.price_max !== p.price_min
                      ? `৳${p.price_min} - ৳${p.price_max}`
                      : `৳${p.price_min}`}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`font-medium ${
                        p.stock > 20 ? 'text-green-600' : p.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {p.is_featured === 1 && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          Featured
                        </span>
                      )}
                      {p.is_new_arrival === 1 && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deleting === p.id}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
