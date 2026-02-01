import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Checkout cancelled</h1>
      <p style={{ color: '#374151' }}>You can return to your cart or try again.</p>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/cart">Back to cart</Link>
        <Link href="/checkout">Back to checkout</Link>
      </div>
    </div>
  );
}

