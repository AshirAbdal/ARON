import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import {
  Droplet,
  Palette,
  SprayCan,
  Scissors,
  Gem,
  Bath,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

// Map category slugs to real, meaningful icons + accent colors.
// Falls back to a generic Sparkles icon if a new category slug appears.
const CATEGORY_VISUAL: Record<
  string,
  { Icon: LucideIcon; bg: string; ring: string; iconColor: string }
> = {
  skincare:    { Icon: Droplet,  bg: 'bg-sky-50',    ring: 'group-hover:bg-sky-500',    iconColor: 'text-sky-600' },
  makeup:      { Icon: Palette,  bg: 'bg-rose-50',   ring: 'group-hover:bg-rose-500',   iconColor: 'text-rose-600' },
  fragrances:  { Icon: SprayCan, bg: 'bg-purple-50', ring: 'group-hover:bg-purple-500', iconColor: 'text-purple-600' },
  'hair-care': { Icon: Scissors, bg: 'bg-amber-50',  ring: 'group-hover:bg-amber-500',  iconColor: 'text-amber-600' },
  accessories: { Icon: Gem,      bg: 'bg-emerald-50',ring: 'group-hover:bg-emerald-500',iconColor: 'text-emerald-600' },
  'body-care': { Icon: Bath,     bg: 'bg-pink-50',   ring: 'group-hover:bg-pink-500',   iconColor: 'text-pink-600' },
};

const FALLBACK_VISUAL = {
  Icon: Sparkles,
  bg: 'bg-gray-100',
  ring: 'group-hover:bg-black',
  iconColor: 'text-gray-700',
};

async function getProducts(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`http://localhost:3000/api/products?${qs}`, {
    cache: 'no-store',
  });
  if (!res.ok) return { products: [], total: 0 };
  return res.json();
}

async function getCategories() {
  const res = await fetch('http://localhost:3000/api/categories', { cache: 'no-store' });
  if (!res.ok) return { categories: [] };
  return res.json();
}

export default async function HomePage() {
  const [featuredData, newArrivalsData, catData] = await Promise.all([
    getProducts({ featured: '1', limit: '4' }),
    getProducts({ new_arrival: '1', limit: '4' }),
    getCategories(),
  ]);

  const featured = featuredData.products || [];
  const newArrivals = newArrivalsData.products || [];
  const categories = catData.categories || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[400px] flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-4">
            ARON — Cosmetics &amp; Fashion
          </h1>
          <p className="text-white/90 text-lg md:text-xl drop-shadow mb-8">
            Discover luxury beauty, skincare, fashion &amp; accessories in Bangladesh.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/products"
              className="bg-black text-white px-8 py-3 font-medium hover:bg-gray-800 transition-colors"
            >
              Shop All
            </Link>
            <Link
              href="/new-arrivals"
              className="bg-white text-black px-8 py-3 font-medium hover:bg-gray-100 transition-colors"
            >
              New Arrivals
            </Link>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-pink-200/30 blur-2xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-purple-200/30 blur-3xl" />
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat: { id: number; name: string; slug: string }) => {
            const visual = CATEGORY_VISUAL[cat.slug] || FALLBACK_VISUAL;
            const { Icon, bg, ring, iconColor } = visual;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 border border-gray-100 hover:border-black hover:bg-gray-50 transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center ${ring} transition-colors`}
                >
                  <Icon className={`w-6 h-6 ${iconColor} group-hover:text-white transition-colors`} strokeWidth={1.75} />
                </div>
                <span className="text-xs font-medium text-center">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">New Arrivals</h2>
            <Link
              href="/new-arrivals"
              className="text-sm underline hover:text-gray-600 transition-colors"
            >
              View All New Arrivals
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newArrivals.map((p: Parameters<typeof ProductCard>[0]['product']) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link
              href="/products?featured=1"
              className="text-sm underline hover:text-gray-600 transition-colors"
            >
              View All Featured
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((p: Parameters<typeof ProductCard>[0]['product']) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Banner strip */}
      <section className="bg-black text-white py-10 text-center">
        <p className="text-2xl font-bold mb-2">Free Delivery in Sherpur</p>
        <p className="text-gray-300 mb-4">On orders above ৳1000 — Cash on Delivery available</p>
        <Link
          href="/products"
          className="inline-block border border-white text-white px-8 py-2.5 hover:bg-white hover:text-black transition-colors font-medium"
        >
          Shop Now
        </Link>
      </section>
    </div>
  );
}
