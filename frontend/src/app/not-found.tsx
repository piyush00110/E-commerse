import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🛍️</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Back to Home
        </Link>
        <Link href="/products" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          Browse Products
        </Link>
      </div>
    </div>
  );
}
