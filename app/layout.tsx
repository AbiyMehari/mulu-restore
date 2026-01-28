// TODO: Implement root layout with metadata, fonts, and providers
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mulu ReStore',
  description: 'Curated vintage and restored furniture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}