'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Nav() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
    router.refresh();
  };

  return (
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
          <div className="flex gap-4 items-center">
            <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors">
              Products
            </Link>
            <Link href="/cart" className="text-gray-700 hover:text-green-700 transition-colors">
              Cart
            </Link>
            {session ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm ml-4"
              >
                Log out
              </button>
            ) : (
              <Link href="/auth/login" className="text-gray-700 hover:text-green-700 transition-colors ml-4">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
