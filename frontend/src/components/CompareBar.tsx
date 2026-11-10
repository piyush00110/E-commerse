'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { productAPI } from '../services/api';
import {
  clearCompare,
  getCompareIds,
  removeFromCompare,
  subscribeCompare,
} from '../lib/compare';
import ProductImage from './ProductImage';
import type { Product } from '../types';

export default function CompareBar() {
  const pathname = usePathname();
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setIds(getCompareIds());
    return subscribeCompare(() => setIds(getCompareIds()));
  }, []);

  const idsKey = ids.join(',');

  useEffect(() => {
    let cancelled = false;
    if (!ids.length) {
      setProducts([]);
      return;
    }
    Promise.all(
      ids.map((id) =>
        productAPI
          .getById(id)
          .then((res) => res.data.data as Product)
          .catch(() => null),
      ),
    ).then((list) => {
      if (!cancelled) setProducts(list.filter(Boolean) as Product[]);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (!ids.length || pathname === '/compare') return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 20,
        transform: 'translateX(-50%)',
        zIndex: 1045,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'var(--bg-card, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        Compare ({ids.length})
      </span>

      <div style={{ display: 'flex', gap: 8 }}>
        {ids.map((id) => {
          const product = products.find((p) => p._id === id);
          return (
            <div key={id} style={{ position: 'relative' }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 10,
                  background: 'var(--bg-container, #f8fafc)',
                  border: '1px solid var(--border, #e5e7eb)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={product?.name || 'Product'}
              >
                <ProductImage
                  src={product?.images?.[0]}
                  alt={product?.name || 'Product'}
                  width={46}
                  height={46}
                  sizes="46px"
                />
              </div>
              <button
                type="button"
                aria-label="Remove from compare"
                onClick={() => setIds(removeFromCompare(id))}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--error, #ef4444)',
                  color: '#fff',
                  fontSize: 11,
                  lineHeight: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => { clearCompare(); setIds([]); }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          whiteSpace: 'nowrap',
        }}
      >
        Clear
      </button>

      <Link
        href="/compare"
        style={{
          padding: '9px 16px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Compare
      </Link>
    </div>
  );
}
