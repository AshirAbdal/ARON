'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import { Search } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  slug: string;
  price_min: number;
  price_max?: number;
  brand?: string;
  category_name?: string;
  primary_image?: string;
  is_new_arrival?: number;
  free_delivery?: number;
  discount_label?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

function ShopAllContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category') || '';
  const audience = searchParams.get('audience') || '';
  const searchQuery = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'latest';
  const perPage = parseInt(searchParams.get('per') || '20');
  const page = parseInt(searchParams.get('page') || '1');

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(perPage),
        offset: String((page - 1) * perPage),
        sort,
        ...(category && { category }),
        ...(audience && { audience }),
        ...(searchQuery && { search: searchQuery }),
      });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, audience, searchQuery, sort, perPage, page]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.ok ? r.json() : { categories: [] })
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);  

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = (updates: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) current.set(k, v);
      else current.delete(k);
    });
    current.delete('page');
    router.push(`/products?${current.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: localSearch });
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Filters row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, category, notes, seasons etc..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black"
            />
          </div>
        </form>

        {/* Category filter */}
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => updateParams({ category: e.target.value })}
          className="border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
        >
          <option value="latest">Latest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A-Z</option>
        </select>

        {/* Per page */}
        <select
          aria-label="Products per page"
          value={perPage}
          onChange={(e) => updateParams({ per: e.target.value })}
          className="border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
        >
          <option value="20">20 per page</option>
          <option value="40">40 per page</option>
          <option value="60">60 per page</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {loading ? 'Loading...' : `${total} product${total !== 1 ? 's' : ''} found`}
      </p>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParams({ page: String(p) })}
              className={`w-9 h-9 text-sm border transition-colors ${
                p === page
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopAllPage() {
  return (
    <Suspense>
      <ShopAllContent />
    </Suspense>
  );
}
