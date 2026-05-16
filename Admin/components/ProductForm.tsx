'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Plus, Upload, GripVertical } from 'lucide-react';

interface Variant {
  name: string;
  price: number | string;
  stock: number | string;
}

interface ProductImage {
  url: string;
  preview?: string;
}

interface Category {
  id: number;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price_min: number | string;
  price_max: number | string;
  brand: string;
  category_id: number | string;
  audience: string;
  is_new_arrival: boolean;
  is_featured: boolean;
  free_delivery: boolean;
  discount_label: string;
  stock: number | string;
  notes: string;
  images: ProductImage[];
  variants: Variant[];
}

export type { ProductFormData };

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel?: string;
}

export default function ProductForm({
  initialData,
  categories,
  onSubmit,
  submitLabel = 'Save Product',
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price_min: initialData?.price_min || '',
    price_max: initialData?.price_max || '',
    brand: initialData?.brand || '',
    category_id: initialData?.category_id || '',
    audience: initialData?.audience || 'unisex',
    is_new_arrival: initialData?.is_new_arrival || false,
    is_featured: initialData?.is_featured || false,
    free_delivery: initialData?.free_delivery || false,
    discount_label: initialData?.discount_label || '',
    stock: initialData?.stock || 100,
    notes: initialData?.notes || '',
    images: initialData?.images || [],
    variants: initialData?.variants || [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const preview = URL.createObjectURL(file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            images: [...prev.images, { url: data.url, preview }],
          }));
        } else {
          URL.revokeObjectURL(preview);
          const err = await res.json();
          alert(err.error || 'Upload failed');
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: '', price: '', stock: 100 }],
    }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.price_min) errs.price_min = 'Base price is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleInput}
              placeholder="Enter product name"
              className={`w-full border px-3 py-2 text-sm rounded focus:outline-none focus:border-black ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInput}
              placeholder="Enter product description..."
              rows={4}
              className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                name="brand"
                value={form.brand}
                onChange={handleInput}
                placeholder="Brand name"
                className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                aria-label="Select category"
                name="category_id"
                value={form.category_id}
                onChange={handleInput}
                className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Audience</label>
            <select
              aria-label="Select audience"
              name="audience"
              value={form.audience}
              onChange={handleInput}
              className="w-full max-w-xs border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
            >
              <option value="unisex">Unisex</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="baby">Baby</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Who is this product for? Shows under the matching navbar group.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="font-semibold mb-4">Pricing & Stock</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Base Price (৳) <span className="text-red-500">*</span>
            </label>
            <input
              name="price_min"
              type="number"
              value={form.price_min}
              onChange={handleInput}
              placeholder="0"
              min="0"
              className={`w-full border px-3 py-2 text-sm rounded focus:outline-none focus:border-black ${
                errors.price_min ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.price_min && (
              <p className="text-xs text-red-500 mt-1">{errors.price_min}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Price (৳)</label>
            <input
              name="price_max"
              type="number"
              value={form.price_max}
              onChange={handleInput}
              placeholder="Leave blank if fixed"
              min="0"
              className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleInput}
              placeholder="100"
              min="0"
              className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Discount Label</label>
          <input
            name="discount_label"
            value={form.discount_label}
            onChange={handleInput}
            placeholder="e.g. 10% OFF, SALE, etc."
            className="w-full max-w-xs border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Variants (Sizes / Options)</h2>
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-1.5 text-sm text-black border border-black px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Variant
          </button>
        </div>
        {form.variants.length === 0 ? (
          <p className="text-sm text-gray-400">
            No variants added. Product will use base price.
          </p>
        ) : (
          <div className="space-y-3">
            {form.variants.map((v, i) => (
              <div key={i} className="flex gap-3 items-center">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <input
                  value={v.name}
                  onChange={(e) => updateVariant(i, 'name', e.target.value)}
                  aria-label="Variant name"
                  placeholder="e.g. 30ml, 50ml, 100ml"
                  className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
                <input
                  type="number"
                  value={v.price}
                  onChange={(e) => updateVariant(i, 'price', e.target.value)}
                  aria-label="Variant price"
                  placeholder="Price ৳"
                  min="0"
                  className="w-28 border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
                <input
                  type="number"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                  aria-label="Variant stock"
                  placeholder="Stock"
                  min="0"
                  className="w-20 border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  aria-label="Remove variant"
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="font-semibold mb-4">Product Images</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {form.images.map((img, i) => (
            <div key={i} className="relative w-24 h-24 border rounded overflow-hidden group">
              <Image
                src={img.preview ?? (img.url.startsWith('http') ? img.url : `https://aronbd.net${img.url}`)}
                alt={`Product image ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] text-center py-0.5">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label="Remove image"
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-black hover:text-black transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-xs">Upload</span>
              </>
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          aria-label="Upload product images"
          onChange={handleImageUpload}
          className="hidden"
        />
        <p className="text-xs text-gray-400">
          First image will be used as primary. Max 5MB per image. Supported: JPEG, PNG, WebP.
        </p>
      </div>

      {/* Flags */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="font-semibold mb-4">Product Flags</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'is_new_arrival', label: 'New Arrival' },
            { name: 'is_featured', label: 'Featured' },
            { name: 'free_delivery', label: 'Free Delivery' },
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name={name}
                checked={form[name as keyof typeof form] as boolean}
                onChange={handleInput}
                className="w-4 h-4 accent-black"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white px-8 py-3 font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-8 py-3 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
