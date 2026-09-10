'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '../types';
import { cartAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

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

  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/400?text=No+Image';

  return (
    <Link href={`/products/${product._id}`} className="product-card" style={{ display: 'block', textDecoration: 'none' }}>
      {badge === 'bestseller' && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 2,
          background: 'var(--secondary)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          letterSpacing: 0.3,
        }}>
          #1 Best Seller
        </div>
      )}
      {badge === 'amazons_choice' && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 2,
          background: 'var(--primary)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          letterSpacing: 0.3,
        }}>
          ShopSmart&apos;s Choice
        </div>
      )}

      {discount >= 5 && (
        <div className="badge badge-success" style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 2,
        }}>
          -{discount}%
        </div>
      )}

      <div className="product-card-image" style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={imageUrl}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.35s ease' }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        <div className="product-card-overlay" style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          padding: '10px 0',
          transform: 'translateY(100%)',
          transition: 'transform 0.3s ease',
          pointerEvents: 'none',
          zIndex: 3,
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.pointerEvents = 'auto';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(100%)';
            e.currentTarget.style.pointerEvents = 'none';
          }}
        >
          <button
            className="product-card-overlay-btn"
            onClick={handleWishlistToggle}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s ease, background 0.2s ease',
              color: isWishlisted ? '#e74c3c' : '#333',
              animation: isWishlisted ? 'heartPulse 0.4s ease' : 'none',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isWishlisted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            )}
          </button>

          <button
            className="product-card-overlay-btn"
            onClick={handleQuickView}
            aria-label="Quick view"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s ease',
              color: '#333',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>

      <div className="product-card-body">
        <h3 className="product-card-name" style={{ transition: 'color 0.2s ease' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--primary, #e74c3c)')}
          onMouseOut={(e) => (e.currentTarget.style.color = '')}
        >{product.name}</h3>

        <div className="product-card-rating">
          {renderStars(product.rating)}
          <span>{(product.numReviews ?? 0).toLocaleString()} reviews</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span className="product-card-price">${(product.price ?? 0).toFixed(2)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="product-card-compare">${(product.comparePrice ?? 0).toFixed(2)}</span>
          )}
          {discount >= 5 && (
            <span className="product-card-discount">Save {discount}%</span>
          )}
        </div>

        {product.countInStock <= 5 && product.countInStock > 0 && (
          <p style={{ fontSize: 12, color: 'var(--tertiary)', marginTop: 6, fontWeight: 500 }}>
            Only {product.countInStock} left in stock - order soon.
          </p>
        )}

        <div className="product-card-actions">
          <button
            className="btn btn-primary btn-sm"
            style={{ width: '100%' }}
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

const ProductCard = React.memo(ProductCardInner);
ProductCard.displayName = 'ProductCard';

export default ProductCard;
