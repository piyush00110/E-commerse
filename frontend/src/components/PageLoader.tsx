import React from 'react';
import { CartSkeleton, GridSkeleton, ProductDetailSkeleton } from './Skeleton';

export type PageLoaderVariant =
  | 'minimal'
  | 'grid'
  | 'detail'
  | 'cart'
  | 'checkout'
  | 'auth'
  | 'table';

function BrandMark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div className="page-loader-logo">S</div>
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--primary, #ff3f6c)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animation: 'spin 0.9s linear infinite' }}
      >
        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
      </svg>
      <div className="page-loader-text">Loading...</div>
    </div>
  );
}

function AuthSkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 24 }} />
        <div className="skeleton skeleton-text" style={{ width: '60%', height: 28, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '80%', height: 14, marginBottom: 28 }} />
        <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 10, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 10, marginBottom: 24 }} />
        <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="loader-two-col" style={{ maxWidth: 1200, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
      <div>
        <div className="skeleton skeleton-text" style={{ width: '40%', height: 24, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: 220, height: 48, borderRadius: 12 }} />
      </div>
      <div>
        <div className="skeleton" style={{ width: '100%', height: 320, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div className="skeleton skeleton-text" style={{ width: 240, height: 28, marginBottom: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: 360, height: 14, marginBottom: 24 }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 160, height: 40, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 10 }} />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="loader-table-row"
          style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 120px 100px 120px',
            gap: 16,
            alignItems: 'center',
            padding: '14px 16px',
            background: 'var(--bg-card)',
            borderRadius: 12,
            marginBottom: 10,
          }}
        >
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
          <div className="skeleton skeleton-text" style={{ height: 16 }} />
          <div className="skeleton skeleton-text" style={{ height: 14 }} />
          <div className="skeleton skeleton-text" style={{ height: 14 }} />
          <div className="skeleton" style={{ height: 32, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

export function PageLoader({ variant = 'minimal' }: { variant?: PageLoaderVariant }) {
  switch (variant) {
    case 'grid':
      return (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
          <div className="skeleton skeleton-text" style={{ width: 220, height: 26, marginBottom: 20 }} />
          <GridSkeleton count={8} />
        </div>
      );
    case 'detail':
      return <ProductDetailSkeleton />;
    case 'cart':
      return <CartSkeleton />;
    case 'checkout':
      return <CheckoutSkeleton />;
    case 'auth':
      return <AuthSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'minimal':
    default:
      return (
        <div className="page-loader">
          <BrandMark />
        </div>
      );
  }
}

export default PageLoader;
