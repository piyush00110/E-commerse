import React from 'react';

export const ProductCardSkeleton: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-image" />
    <div style={{ padding: 16 }}>
      <div className="skeleton skeleton-text" style={{ width: '90%', height: 16 }} />
      <div className="skeleton skeleton-text" style={{ width: '60%', height: 14, marginTop: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: '40%', height: 22, marginTop: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: '100%', height: 40, marginTop: 12, borderRadius: 8 }} />
    </div>
  </div>
);

export const ProductDetailSkeleton: React.FC = () => (
  <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24 }}>
    <div className="skeleton skeleton-text" style={{ width: 200, height: 14 }} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 24 }}>
      <div>
        <div className="skeleton" style={{ width: '100%', height: 400, borderRadius: 12 }} />
      </div>
      <div>
        <div className="skeleton skeleton-text" style={{ width: '80%', height: 28 }} />
        <div className="skeleton skeleton-text" style={{ width: '50%', height: 18, marginTop: 12 }} />
        <div className="skeleton skeleton-text" style={{ width: '30%', height: 32, marginTop: 16 }} />
        <div className="skeleton skeleton-text" style={{ width: '100%', height: 16, marginTop: 12 }} />
        <div className="skeleton skeleton-text" style={{ width: '100%', height: 16, marginTop: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '60%', height: 40, marginTop: 24 }} />
      </div>
    </div>
  </div>
);

export const CartSkeleton: React.FC = () => (
  <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
    <div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 20, padding: 20, background: 'white', borderRadius: 12, marginBottom: 12 }}>
          <div className="skeleton" style={{ width: 140, height: 140, borderRadius: 8, minWidth: 140 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '70%', height: 18 }} />
            <div className="skeleton skeleton-text" style={{ width: '30%', height: 22, marginTop: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: '40%', height: 36, marginTop: 12 }} />
          </div>
        </div>
      ))}
    </div>
    <div>
      <div className="skeleton" style={{ width: '100%', height: 250, borderRadius: 12 }} />
    </div>
  </div>
);

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="product-grid">
    {Array.from({ length: count }, (_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);
