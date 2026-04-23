'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductForm, { type ProductFormData } from '@/components/ProductForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState([]);
  const [productData, setProductData] = useState<null | {
    product: Record<string, unknown>;
    images: { image_url: string }[];
    variants: { name: string; price: number; stock: number }[];
  }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${params.id}`).then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]).then(([prodData, catData]) => {
      setProductData(prodData);
      setCategories(catData.categories || []);
      setLoading(false);
    });
  }, [params.id]);

  const handleSubmit = async (data: ProductFormData) => {
    const res = await fetch(`/api/products/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push('/products');
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to update product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!productData?.product) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Product not found.</p>
        <Link href="/products" className="mt-2 inline-block underline text-sm">
          Back to products
        </Link>
      </div>
    );
  }

  const { product, images, variants } = productData;

  const initialData = {
    name: product.name as string,
    description: product.description as string || '',
    price_min: product.price_min as number,
    price_max: product.price_max as number || '',
    brand: product.brand as string || '',
    category_id: product.category_id as number || '',
    audience: (product.audience as string) || 'unisex',
    is_new_arrival: product.is_new_arrival === 1,
    is_featured: product.is_featured === 1,
    free_delivery: product.free_delivery === 1,
    discount_label: product.discount_label as string || '',
    stock: product.stock as number || 100,
    notes: product.notes as string || '',
    images: images.map((img) => ({ url: img.image_url })),
    variants: variants.map((v) => ({ name: v.name, price: v.price, stock: v.stock })),
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500 mt-1">{product.name as string}</p>
      </div>

      <ProductForm
        initialData={initialData}
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Update Product"
      />
    </div>
  );
}
