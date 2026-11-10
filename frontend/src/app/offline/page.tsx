import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'You are offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 56 }} aria-hidden="true">
        📡
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>You are offline</h1>
      <p style={{ color: '#6b7280', maxWidth: 420, margin: 0 }}>
        Check your internet connection and try again. Pages you visited recently may
        still be available.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 8,
          padding: '10px 20px',
          borderRadius: 10,
          background: '#6366f1',
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Go to homepage
      </Link>
    </main>
  );
}
