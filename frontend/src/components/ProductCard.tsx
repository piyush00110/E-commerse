'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '../types';
import { cartAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { GradientButton } from '@/components/ui/gradient-button';

interface Props {
  product: Product;
  badge?: 'bestseller' | 'amazons_choice' | null;
}

const ProductCardInner: React.FC<Props> = ({ product, badge }) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [isWishlisted, setIsWishlisted] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('wishlist');
      const list: string[] = stored ? JSON.parse(stored) : [];
      return list.includes(product._id);
    } catch {
      return false;
    }
  });

  const renderStars = (rating: number) => {
    const stars: React.ReactNode[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<span key={i} className="star">&#9733;</span>);
      } else if (i - 0.5 <= rating) {
        stars.push(<span key={i} className="star">&#9733;</span>);
      } else {
        stars.push(<span key={i} className="star-empty">&#9734;</span>);
      }
    }
    return stars;
  };

  const discount = product.comparePrice && product.comparePrice > 0
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { router.push('/login'); return; }
      await cartAPI.add(product._id);
      showToast(`${product.name} added to cart!`, 'success');
    } catch {
      showToast('Failed to add to cart', 'error');
    }
  };

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(prev => {
      const next = !prev;
      try {
        const stored = localStorage.getItem('wishlist');
        const list: string[] = stored ? JSON.parse(stored) : [];
        if (next) {
          if (!list.includes(product._id)) list.push(product._id);
        } else {
          const idx = list.indexOf(product._id);
          if (idx !== -1) list.splice(idx, 1);
        }
        localStorage.setItem('wishlist', JSON.stringify(list));
      } catch { /* ignore */ }
      return next;
    });
  }, [product._id]);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product._id}`);
  }, [router, product._id]);

  const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="#e5e7eb"><rect width="400" height="400"/><text x="200" y="208" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="14">No Image</text></svg>');
  const imageUrl = product.images?.[0] || PLACEHOLDER_IMG;

  return (
    <Link
      href={`/products/${product._id}`}
      className="product-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        position: 'relative',
      }}
    >
      <div className="product-card-image" style={{ position: 'relative' }}>
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />

        {(badge === 'bestseller' || badge === 'amazons_choice' || (discount >= 5)) && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'flex-start',
          }}>
            {discount >= 5 && (
              <div className="badge badge-success" style={{
                background: 'var(--error)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                letterSpacing: 0.2,
              }}>
                -{discount}%
              </div>
            )}
            {badge === 'bestseller' && (
              <div style={{
                background: 'var(--text)',
                color: 'var(--text-inverse)',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Bestseller
              </div>
            )}
            {badge === 'amazons_choice' && (
              <div style={{
                background: 'var(--warning)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Amazon&apos;s Choice
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: isWishlisted ? 'var(--error)' : 'var(--text-tertiary)',
            transition: 'color 0.2s ease, transform 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isWishlisted ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          )}
        </button>
      </div>

      <div className="product-card-body" style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3 className="product-card-name" style={{
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.35,
          color: 'var(--text)',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {product.name}
        </h3>

        {product.rating > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            background: 'var(--success-light)',
            padding: '2px 8px',
            borderRadius: 3,
            width: 'fit-content',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--success-dark)',
          }}>
            <span>{product.rating.toFixed(1)}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
              | {(product.numReviews ?? 0) >= 1000 ? `${((product.numReviews ?? 0) / 1000).toFixed(1)}k` : (product.numReviews ?? 0).toLocaleString()}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          <span className="product-card-price" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            ${(product.price ?? 0).toFixed(2)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="product-card-compare" style={{ fontSize: 13, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
              ${(product.comparePrice ?? 0).toFixed(2)}
            </span>
          )}
          {discount >= 5 && (
            <span className="product-card-discount" style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)' }}>
              ({discount}% OFF)
            </span>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500, marginTop: 1 }}>
          FREE delivery
        </div>

        {product.countInStock <= 5 && product.countInStock > 0 && (
          <p style={{ fontSize: 12, color: 'var(--error)', margin: 0, fontWeight: 500 }}>
            Only {product.countInStock} left in stock - order soon.
          </p>
        )}

        <div className="product-card-actions" style={{ marginTop: 'auto', paddingTop: 8 }}>
          <GradientButton
            size="sm"
            fullWidth
            style={{ borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600 }}
            onClick={handleAddToCart}
          >
            Add to Cart
          </GradientButton>
        </div>
      </div>
    </Link>
  );
};

const ProductCard = React.memo(ProductCardInner);
ProductCard.displayName = 'ProductCard';

export default ProductCard;
