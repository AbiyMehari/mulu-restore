import { cookies, headers } from 'next/headers';
import EditProductForm from './EditProductForm';

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  stockQuantity: number;
  category?: { _id: string; name: string; slug: string };
  condition: 'vintage' | 'restored' | 'used';
  shortDescription: string;
  fullDescription: string;
  images: string[];
  isActive: boolean;
  shipping?: { pickupOnly: boolean; shippingPossible: boolean; shippingNotes?: string };
};

function getBaseUrl() {
  const env = process.env.NEXTAUTH_URL;
  if (env) return env.replace(/\/$/, '');

  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  if (!host) return 'http://localhost:3000';
  return `${proto}://${host}`;
}

export default async function AdminEditProductPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const baseUrl = getBaseUrl();

  const [productRes, categoriesRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/products/${params.id}`, {
      cache: 'no-store',
      headers: { Cookie: cookieStore.toString() },
    }),
    fetch(`${baseUrl}/api/admin/categories`, {
      cache: 'no-store',
      headers: { Cookie: cookieStore.toString() },
    }),
  ]);

  if (!productRes.ok) {
    const text = await productRes.text().catch(() => '');
    return (
      <div>
        <h1>Edit Product</h1>
        <p style={{ color: '#b91c1c' }}>Failed to load product ({productRes.status})</p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
      </div>
    );
  }

  if (!categoriesRes.ok) {
    const text = await categoriesRes.text().catch(() => '');
    return (
      <div>
        <h1>Edit Product</h1>
        <p style={{ color: '#b91c1c' }}>Failed to load categories ({categoriesRes.status})</p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
      </div>
    );
  }

  const productData = (await productRes.json()) as { item?: Product };
  const categoriesData = (await categoriesRes.json()) as { items?: Category[] };

  const product = productData.item as Product;
  const categories = categoriesData.items ?? [];

  return (
    <div>
      <h1>Edit Product</h1>
      <div style={{ marginTop: '1rem' }}>
        <EditProductForm product={product} categories={categories} />
      </div>
    </div>
  );
}

