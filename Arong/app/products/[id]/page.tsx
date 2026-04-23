'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

interface Variant {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface ProductImage {
  id: number;
  image_url: string;
  is_primary: number;
}

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price_min: number;
  price_max?: number;
  brand?: string;
  category_name?: string;
  is_new_arrival?: number;
  free_delivery?: number;
  discount_label?: string;
  stock: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, addItemSilent } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<ProductDetail[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setProduct(data.product);
        setImages(data.images || []);
        setVariants(data.variants || []);
        if (data.variants?.length > 0) setSelectedVariant(data.variants[0]);
        const primary = data.images?.find((img: ProductImage) => img.is_primary) || data.images?.[0];
        if (primary) setActiveImage(primary.image_url);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  useEffect(() => {
    if (!product) return;
    fetch('/api/products?limit=4')
      .then((r) => r.json())
      .then((d) => setRelated((d.products || []).filter((p: ProductDetail) => p.id !== product.id).slice(0, 4)));
  }, [product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-100 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 animate-pulse w-1/2" />
            <div className="h-4 bg-gray-100 animate-pulse w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-lg text-gray-500">Product not found.</p>
        <Link href="/products" className="mt-4 inline-block underline text-sm">
          Back to shop
        </Link>
      </div>
    );
  }

  const price = selectedVariant?.price || product.price_min;
  const displayImage = activeImage || '/placeholder.jpg';

  const handleAddToCart = () => {
    setAdding(true);
    addItem({
      product_id: product.id,
      product_name: product.name,
      variant_name: selectedVariant?.name,
      price,
      quantity,
      image: displayImage,
    });
    setTimeout(() => setAdding(false), 800);
  };

  const handleBuyNow = () => {
    // Use addItemSilent so the React context state stays in sync with
    // localStorage AND the cart sidebar does not flash open before navigation.
    addItemSilent({
      product_id: product.id,
      product_name: product.name,
      variant_name: selectedVariant?.name,
      price,
      quantity,
      image: displayImage,
    });
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gray-50 border overflow-hidden mb-3">
            <Image
              src={displayImage.startsWith('http') ? displayImage : `http://localhost:3000${displayImage}`}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
            {product.discount_label && (
              <span className="absolute top-3 left-3 bg-teal-500 text-white text-xs px-2 py-1">
                {product.discount_label}
              </span>
            )}
            {product.free_delivery === 1 && (
              <span className="absolute top-3 right-3 bg-teal-500 text-white text-xs px-2 py-1">
                Free Delivery
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image_url)}
                  aria-label={`View image ${img.id}`}
                  className={`relative aspect-square border-2 overflow-hidden transition-colors ${
                    activeImage === img.image_url ? 'border-black' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:3000${img.image_url}`}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category_name && (
            <Link
              href={`/products?category=${product.category_name.toLowerCase()}`}
              className="text-xs text-gray-500 uppercase tracking-wider hover:text-black mb-2 block"
            >
              {product.category_name}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
          {product.brand && (
            <p className="text-sm text-gray-600 mb-4">
              Brand: <span className="font-medium">{product.brand}</span>
            </p>
          )}

          <p className="text-2xl font-bold mb-6">৳{price.toLocaleString()}</p>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Select Size / Option:</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      selectedVariant?.id === v.id
                        ? 'bg-black text-white border-black'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {v.name} — ৳{v.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-sm font-medium">Quantity:</p>
            <div className="flex items-center border">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-black text-white py-3.5 font-medium hover:bg-gray-800 transition-colors"
            >
              Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className={`flex-1 border py-3.5 font-medium transition-colors ${
                adding
                  ? 'bg-black text-white border-black'
                  : 'border-black text-black hover:bg-gray-50'
              }`}
            >
              {adding ? 'Added to Cart!' : 'Add to Cart'}
            </button>
          </div>

          {/* Features */}
          <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Cash on Delivery available
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {product.free_delivery === 1 ? 'Free delivery included' : 'Fast delivery across Bangladesh'}
            </div>
            {product.stock > 0 && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                In stock
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold mb-2">Product Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
