import Link from 'next/link';

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams?: { id?: string | string[] };
}) {
  const idRaw = searchParams?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  return (
    <div>
      <h1>Order placed successfully</h1>

      {id ? (
        <p>
          <strong>Order ID:</strong> {id}
        </p>
      ) : null}

      <div style={{ marginTop: '1rem' }}>
        <Link href="/products" style={{ marginRight: '1rem' }}>
          Continue shopping
        </Link>
        <Link href="/admin/orders">Admin orders</Link>
      </div>
    </div>
  );
}

