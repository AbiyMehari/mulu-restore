import Link from 'next/link';
import Image from 'next/image';
import { getCurrentSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  
  if (!session || session.user.role !== 'admin') {
    redirect('/auth/login?callbackUrl=/admin');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/admin" className="flex items-center gap-3">
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
            <div className="flex gap-6 items-center">
              <Link href="/" className="text-gray-700 hover:text-green-700 transition-colors">
                Store
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/admin/products" className="text-gray-700 hover:text-green-700 transition-colors">
                Products
              </Link>
              <Link href="/admin/categories" className="text-gray-700 hover:text-green-700 transition-colors">
                Categories
              </Link>
              <Link href="/admin/orders" className="text-gray-700 hover:text-green-700 transition-colors">
                Orders
              </Link>
              <Link href="/admin/users" className="text-gray-700 hover:text-green-700 transition-colors">
                Users
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
