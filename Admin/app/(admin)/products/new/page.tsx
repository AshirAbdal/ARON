'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  const handleSubmit = async (data: Parameters<typeof ProductForm>[0]['onSubmit'] extends (data: infer T) => unknown ? T : never) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push('/products');
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to create product');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
      </div>

      <ProductForm
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Create Product"
      />
    </div>
  );
}
