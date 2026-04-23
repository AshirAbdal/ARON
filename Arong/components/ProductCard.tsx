'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface Variant {
  id: number;
  name: string;
  price: number;
}

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
  variants?: Variant[];
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const [adding, setAdding] = useState(false);

  const image = product.primary_image || '/placeholder.jpg';
  const hasVariants = product.variants && product.variants.length > 0;
  const defaultVariant = hasVariants ? product.variants![0] : null;

  const priceDisplay =
    product.price_max && product.price_max !== product.price_min
      ? `৳${product.price_min} - ৳${product.price_max}`
      : `৳${product.price_min}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addItem({
      product_id: product.id,
      product_name: product.name,
      variant_name: defaultVariant?.name,
      price: defaultVariant?.price || product.price_min,
      quantity: 1,
      image,
    });
    setTimeout(() => setAdding(false), 800);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      product_id: product.id,
      product_name: product.name,
      variant_name: defaultVariant?.name,
      price: defaultVariant?.price || product.price_min,
      quantity: 1,
      image,
    });
    window.location.href = '/checkout';
  };

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={image.startsWith('http') ? image : `http://localhost:3000${image}`}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized
          />
          {/* Left badges — stacked vertically */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_new_arrival === 1 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 uppercase font-medium">
                New
              </span>
            )}
            {product.category_name && (
              <span className="bg-black text-white text-[10px] px-2 py-0.5 uppercase font-medium">
                {product.category_name}
              </span>
            )}
            {product.discount_label && (
              <span className="bg-teal-500 text-white text-[10px] px-2 py-0.5 font-medium">
                {product.discount_label}
              </span>
            )}
          </div>
          {/* Right badge */}
          {product.free_delivery === 1 && (
            <span className="absolute top-2 right-2 bg-teal-500 text-white text-[10px] px-2 py-0.5 font-medium">
              Free Delivery
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-3">
          <h3 className="font-medium text-sm leading-snug mb-1 line-clamp-2 group-hover:underline">
            {product.name}
          </h3>
          {product.category_name && (
            <p className="text-xs text-gray-500 italic mb-0.5">{product.category_name}</p>
          )}
          {product.brand && (
            <p className="text-xs text-gray-600 mb-2">
              <span className="font-medium">Brand:</span> {product.brand}
            </p>
          )}
          <p className="font-bold text-sm mb-3">{priceDisplay}</p>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-black text-white text-xs py-2 px-3 font-medium hover:bg-gray-800 transition-colors"
            >
              Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className={`flex-1 border border-black text-xs py-2 px-3 font-medium transition-colors ${
                adding
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              {adding ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
