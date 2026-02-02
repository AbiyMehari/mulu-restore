import type { Metadata } from 'next';
import { CartProvider } from '@/app/providers/CartProvider';
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
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}