'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { wishlistAPI, cartAPI } from '../services/api';
import { Product } from '../types';
import { useToast } from '../context/ToastContext';
import { GridSkeleton } from '../components/Skeleton';
import { GradientButton } from '@/components/ui/gradient-button';

const WishlistPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await wishlistAPI.get();
      setProducts(res.data.data.products || []);
    } catch { showToast('Failed to load wishlist', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    fetchWishlist();
  }, [fetchWishlist, router]);

  const handleRemove = async (productId: string) => {
    try {
      await wishlistAPI.remove(productId);
      setProducts(products.filter((p) => p._id !== productId));
      showToast('Removed from wishlist', 'info');
    } catch { showToast('Failed to remove', 'error'); }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await cartAPI.add(productId);
      showToast('Added to cart!', 'success');
    } catch { showToast('Failed to add to cart', 'error'); }
  };

  if (loading) return <GridSkeleton count={4} />;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>My Wishlist</h1>
          {products.length > 0 && (
            <span className="badge badge-success" style={{ fontSize: 13, padding: '4px 12px' }}>
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          {products.length === 0 ? 'Save items you love to your wishlist.' : 'Items you&apos;ve saved for later.'}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{'\u{1F497}'}</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Your wishlist is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Save items you love to your wishlist. Browse products and click the heart icon to add them.
          </p>
          <Link href="/products" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {products.map((product) => {
            const discount = product.comparePrice
              ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
            return (
              <div key={product._id} className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                {/* Remove Button */}
                <button type="button" aria-label="Remove from wishlist" onClick={() => handleRemove(product._id)} style={{
                  position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 9999,
                  background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 16, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444',
                  transition: 'all 0.2s',
                }}>
                  {'\u2764'}
                </button>

                {/* Discount Badge */}
                {discount > 0 && (
                  <div style={{
                    position: 'absolute', top: 12, left: 12, padding: '3px 10px', borderRadius: 9999,
                    background: 'var(--success-light)', color: 'var(--success-dark)', fontSize: 11, fontWeight: 700, zIndex: 2,
                  }}>
                    -{discount}%
                  </div>
                )}

                {/* Product Image */}
                <Link href={`/products/${product._id}`} style={{ display: 'block' }}>
                  <div style={{
                    aspectRatio: '1/1', background: 'var(--bg-card)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 16,
                  }}>
                    <img src={(product.images?.[0] || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23e5e7eb"><rect width="400" height="400"/><text x="200" y="208" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14">No Image</text></svg>'))} alt={product.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
                  </div>
                </Link>

                {/* Product Info */}
                <div style={{ padding: '16px 16px 20px' }}>
                  <Link href={`/products/${product._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      minHeight: 40,
                    }}>
                      {product.name}
                    </div>
                  </Link>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 1 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ fontSize: 12, color: s <= Math.round(product.rating) ? '#f59e0b' : '#d1d5db' }}>{'\u2605'}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({product.numReviews || 0})</span>
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      ${(product.price ?? 0).toFixed(2)}
                    </span>
                    {product.comparePrice && (
                      <span style={{ fontSize: 14, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                        ${(product.comparePrice ?? 0).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div style={{ marginBottom: 12 }}>
                    {product.countInStock > 0 ? (
                      <span className="badge badge-success" style={{ fontSize: 11, padding: '3px 8px' }}>
                        In Stock
                      </span>
                    ) : (
                      <span className="badge badge-error" style={{ fontSize: 11, padding: '3px 8px' }}>
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <GradientButton onClick={() => handleAddToCart(product._id)}
                    style={{ width: '100%', height: 40, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    disabled={product.countInStock === 0}>
                    <span>{'\u{1F6D2}'}</span> Add to Cart
                  </GradientButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
