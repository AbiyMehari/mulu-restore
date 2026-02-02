import type { Metadata } from 'next';
import { CartProvider } from '@/app/providers/CartProvider';
import { SessionProvider } from '@/app/providers/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mulu ReStore - Intercultural. Sustainable. Connected.',
  description: 'Curated vintage and restored furniture combining German craftsmanship with Ethiopian cultural heritage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <CartProvider>{children}</CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}