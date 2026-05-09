'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  slug?: string;
  category_name?: string;
  brand?: string;
  price_min: number;
  primary_image?: string;
  free_delivery?: number;
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&limit=6`
        );
        const data = await res.json();
        setResults(data.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-white max-w-2xl w-full mx-auto mt-20 rounded-sm shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-base outline-none"
          />
          <button onClick={onClose} aria-label="Close search" className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="p-6 text-center text-gray-500 text-base">Searching...</div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-base">
              No products found for &quot;{query}&quot;
            </div>
          )}
          {results.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug || product.id}`}
              onClick={onClose}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 border-b last:border-0 transition-colors"
            >
              <div className="relative w-14 h-14 flex-shrink-0 bg-gray-100">
                <Image
                  src={product.primary_image || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-base">{product.name}</p>
                {product.category_name && (
                  <p className="text-base text-gray-500">
                    Category: {product.category_name}
                  </p>
                )}
                {product.brand && (
                  <p className="text-base text-gray-500">Brand: {product.brand}</p>
                )}
                <p className="text-base font-medium mt-0.5">৳{product.price_min}</p>
              </div>
              {product.free_delivery === 1 && (
                <span className="text-base bg-teal-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                  Free Delivery
                </span>
              )}
            </Link>
          ))}
          {!query && (
            <div className="p-6 text-center text-gray-400 text-base">
              Start typing to search for products...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
