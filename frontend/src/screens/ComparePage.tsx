'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartAPI, productAPI } from '../services/api';
import { clearCompare, getCompareIds, removeFromCompare } from '../lib/compare';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';
import type { Category, Product } from '../types';

const ComparePage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getCompareIds();
    if (!ids.length) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        productAPI
          .getById(id)
          .then((res) => res.data.data as Product)
          .catch(() => null),
      ),
    )
      .then((list) => {
        if (!cancelled) setProducts(list.filter(Boolean) as Product[]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemove = (id: string) => {
    removeFromCompare(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const handleClear = () => {
    clearCompare();
    setProducts([]);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) {
        router.push('/login?redirect=%2Fcompare');
        return;
      }
      await cartAPI.add(product._id);
      showToast(`${product.name} added to cart!`, 'success');
    } catch {
      showToast('Failed to add to cart', 'error');
    }
  };

  const categoryName = (product: Product) => {
    const category = product.category as Category | string | undefined;
    if (category && typeof category === 'object') return category.name;
    return '—';
  };

  const rows: { label: string; render: (product: Product) => React.ReactNode }[] = [
    {
      label: 'Price',
      render: (p) => (
        <div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
            ${(p.price ?? 0).toFixed(2)}
          </span>
          {p.comparePrice && p.comparePrice > p.price && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
              ${p.comparePrice.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      label: 'Rating',
      render: (p) =>
        p.rating > 0 ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success-dark, #15803d)' }}>
            ★ {p.rating.toFixed(1)}{' '}
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
              ({p.numReviews ?? 0})
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No reviews</span>
        ),
    },
    {
      label: 'Brand',
      render: (p) => (
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{p.brand || '—'}</span>
      ),
    },
    {
      label: 'Category',
      render: (p) => (
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{categoryName(p)}</span>
      ),
    },
    {
      label: 'Availability',
      render: (p) =>
        p.countInStock > 0 ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success-dark, #15803d)' }}>
            In stock ({p.countInStock})
          </span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--error, #dc2626)' }}>
            Out of stock
          </span>
        ),
    },
    {
      label: 'Highlights',
      render: (p) =>
        p.features && p.features.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {p.features.slice(0, 5).map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
        ),
    },
  ];

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Compare products
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Side-by-side specs to help you choose.
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={handleClear}
            className="btn btn-ghost"
            style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Clear all
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="card" style={{ padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>⚖️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
            Nothing to compare yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            Add up to 4 products using the compare button on any product card.
          </p>
          <Link
            href="/products"
            style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ width: 150, padding: 16, textAlign: 'left', fontSize: 12, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>
                  Product
                </th>
                {products.map((product) => (
                  <th key={product._id} style={{ padding: 16, textAlign: 'center', borderBottom: '1px solid var(--border)', minWidth: 200 }}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => handleRemove(product._id)}
                        aria-label={`Remove ${product.name} from comparison`}
                        style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--bg-container)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
                      >
                        ×
                      </button>
                      <Link href={`/products/${product._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{ width: 120, height: 120, margin: '0 auto 10px', background: 'var(--bg-container)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <ProductImage src={product.images?.[0]} alt={product.name} width={120} height={120} sizes="120px" />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>
                          {product.name}
                        </div>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--bg-container)', verticalAlign: 'top' }}>
                    {row.label}
                  </td>
                  {products.map((product) => (
                    <td key={product._id} style={{ padding: '14px 16px', textAlign: 'center', borderBottom: '1px solid var(--bg-container)', verticalAlign: 'top' }}>
                      {row.render(product)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td style={{ padding: '16px' }} />
                {products.map((product) => (
                  <td key={product._id} style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.countInStock <= 0}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: 'none',
                        background: product.countInStock > 0 ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--bg-container)',
                        color: product.countInStock > 0 ? '#fff' : 'var(--text-tertiary)',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: product.countInStock > 0 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
