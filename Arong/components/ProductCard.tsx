'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const { addItem, addItemSilent } = useCart();
  const router = useRouter();
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
    addItemSilent({
      product_id: product.id,
      product_name: product.name,
      variant_name: defaultVariant?.name,
      price: defaultVariant?.price || product.price_min,
      quantity: 1,
      image,
    });
    router.push('/checkout');
  };

  return (
    <Link href={`/products/${product.slug || product.id}`} className="group block h-full">
      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized
          />
          {/* Left badges — compact overlay chips */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_new_arrival === 1 && (
              <span className="bg-rose-500 text-white text-base leading-none px-2 py-1 uppercase font-semibold rounded-sm">
                New
              </span>
            )}
            {product.discount_label && (
              <span className="bg-teal-500 text-white text-base leading-none px-2 py-1 font-semibold rounded-sm">
                {product.discount_label}
              </span>
            )}
          </div>
          {/* Free delivery badge — bottom left */}
          {product.free_delivery === 1 && (
            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-base leading-none px-2 py-1 font-medium rounded-sm">
              Free Delivery
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-3 flex flex-col flex-1">
          {product.category_name && (
            <p className="text-base text-gray-400 uppercase tracking-wide mb-0.5">{product.category_name}</p>
          )}
          <h3 className="font-medium text-base leading-snug mb-1 line-clamp-2 group-hover:underline flex-1">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-base text-gray-500 mb-1">{product.brand}</p>
          )}
          <p className="font-bold text-base mb-3">{priceDisplay}</p>

          {/* Buttons — stacked for clean layout */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleBuyNow}
              className="w-full bg-black text-white text-base py-2.5 font-medium hover:bg-gray-800 transition-colors rounded-sm"
            >
              Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className={`w-full border border-black text-base py-2.5 font-medium transition-colors rounded-sm ${
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
