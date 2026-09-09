'use client';

import React from 'react';
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

      <div className="product-card-image">
        <img
          src={imageUrl}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>

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
