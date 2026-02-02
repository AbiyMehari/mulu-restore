import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import AddToCartButton from './AddToCartButton';

type ProductDetail = {
  title: string;
  price: number;
  images: string[];
  stockQuantity?: number;
  description: string;
  condition?: string;
  category?: { name: string; slug: string } | null;
};

type ProductListItem = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
};

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const base = `${protocol}://${host}`;

  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch(`${base}/api/products/${params.slug}`, { cache: 'no-store' });

  if (res.status === 404) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Mulu ReStore Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <span className="text-2xl font-bold text-green-800">
                  Mulu ReStore
                </span>
              </Link>
              <div className="flex gap-6">
                <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
                  Products
                </Link>
                <Link href="/cart" className="text-gray-700 hover:text-green-700 transition-colors">
                  Cart
                </Link>
                <Link href="/auth/login" className="text-gray-700 hover:text-green-700 transition-colors">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/products" className="text-green-700 hover:text-green-800 font-medium mb-4 inline-block transition-colors">
            ← Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product</h1>
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    );
  }

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Mulu ReStore Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <span className="text-2xl font-bold text-green-800">
                  Mulu ReStore
                </span>
              </Link>
              <div className="flex gap-6">
                <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
                  Products
                </Link>
                <Link href="/cart" className="text-gray-700 hover:text-green-700 transition-colors">
                  Cart
                </Link>
                <Link href="/auth/login" className="text-gray-700 hover:text-green-700 transition-colors">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/products" className="text-green-700 hover:text-green-800 font-medium mb-4 inline-block transition-colors">
            ← Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product</h1>
          <p className="text-red-600">Failed to load product</p>
        </div>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { item?: ProductDetail };
  const item = data.item;

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Mulu ReStore Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <span className="text-2xl font-bold text-green-800">
                  Mulu ReStore
                </span>
              </Link>
              <div className="flex gap-6">
                <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
                  Products
                </Link>
                <Link href="/cart" className="text-gray-700 hover:text-green-700 transition-colors">
                  Cart
                </Link>
                <Link href="/auth/login" className="text-gray-700 hover:text-green-700 transition-colors">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/products" className="text-green-700 hover:text-green-800 font-medium mb-4 inline-block transition-colors">
            ← Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product</h1>
          <p className="text-red-600">Failed to load product</p>
        </div>
      </div>
    );
  }

  const images = Array.isArray(item.images) ? item.images : [];
  const firstImage = images[0];
  const stock = typeof item.stockQuantity === 'number' ? item.stockQuantity : 0;

  const listRes = await fetch(`${base}/api/products`, { cache: 'no-store' });
  const listData = listRes.ok ? ((await listRes.json().catch(() => ({}))) as { items?: ProductListItem[] }) : {};
  const listItems = Array.isArray(listData.items) ? listData.items : [];
  const matching = listItems.find((p) => p.slug === params.slug);
  const productId = matching?._id || params.slug;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Mulu ReStore Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-green-800">
                Mulu ReStore
              </span>
            </Link>
            <div className="flex gap-6">
              <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
                Products
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-green-700 transition-colors">
                Cart
              </Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-green-700 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/products" className="text-green-700 hover:text-green-800 font-medium mb-6 inline-block transition-colors">
          ← Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {images.length === 0 ? (
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            ) : (
              <div className="aspect-square relative">
                <img
                  src={firstImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-4 border-t border-gray-200">
                {images.slice(0, 4).map((src, idx) => (
                  <div key={`${src}-${idx}`} className="aspect-square relative overflow-hidden rounded border border-gray-200">
                    <img
                      src={src}
                      alt={`${item.title} image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{item.title}</h1>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-green-700 mb-2">
                {eur.format((item.price ?? 0) / 100)}
              </div>
              <div className={`text-lg font-medium ${stock <= 0 ? 'text-red-600' : 'text-gray-700'}`}>
                {stock <= 0 ? 'Out of stock' : `In stock: ${stock}`}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {item.category?.name && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Category:</span>
                  <Link
                    href={`/products?category=${item.category.slug}`}
                    className="text-green-700 hover:text-green-800 transition-colors"
                  >
                    {item.category.name}
                  </Link>
                </div>
              )}
              {item.condition && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Condition:</span>
                  <span className="text-gray-900">{item.condition}</span>
                </div>
              )}
            </div>

            <AddToCartButton
              productId={productId}
              title={item.title}
              price={item.price ?? 0}
              stockQuantity={stock}
              slug={params.slug}
              image={firstImage}
            />
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {item.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
