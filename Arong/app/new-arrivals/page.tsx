import ProductCard from '@/components/ProductCard';

async function getNewArrivals() {
  const res = await fetch('http://localhost:3000/api/products?new_arrival=1&limit=50', {
    cache: 'no-store',
  });
  if (!res.ok) return { products: [], total: 0 };
  return res.json();
}

export default async function NewArrivalsPage() {
  const data = await getNewArrivals();
  const products = data.products || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New Arrivals</h1>
        <p className="text-gray-500">
          Fresh additions to our collection — be the first to discover the latest in beauty.
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((p: Parameters<typeof ProductCard>[0]['product']) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p>No new arrivals yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
